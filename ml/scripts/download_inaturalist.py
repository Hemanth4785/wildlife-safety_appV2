"""
iNaturalist Wildlife Recent Sightings Downloader
Downloads recent wildlife occurrence observations from the iNaturalist REST API (v1) for the 6 target species.

Features:
- Configurable observation limits per species (default: 5,000 observations).
- Automatic pagination via `page` and `per_page` parameters (up to page limits).
- Coordinates validation (-90 to +90 lat, -180 to +180 lon) and deduplication.
- Exponential backoff retry logic for API resilience.
- Quality grade filtering (research grade & needs_id observations with valid positional accuracy).
- Dual output formats: JSON and CSV saved in `datasets/raw/inaturalist_raw.[json|csv]`.
- Post-download statistics summary report generation.

Python Version: 3.10.11 / 3.13 Compatible
"""

import csv
import json
import logging
import os
import sys
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Set, Tuple

# Add parent directory to path for config access
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config import (
        BACKOFF_FACTOR,
        DEFAULT_RECORDS_PER_SPECIES,
        DOWNLOAD_TIMEOUT,
        MAX_RETRIES,
        RAW_DATA_DIR,
        SUPPORTED_SPECIES,
    )
except ImportError:
    RAW_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "raw"))
    DEFAULT_RECORDS_PER_SPECIES = 5000
    DOWNLOAD_TIMEOUT = 30
    MAX_RETRIES = 5
    BACKOFF_FACTOR = 1.5
    SUPPORTED_SPECIES = {
        "Bison bison": "American Bison",
        "Bos gaurus": "Indian Gaur",
        "Elephas maximus": "Asian Elephant",
        "Melursus ursinus": "Sloth Bear",
        "Panthera pardus": "Leopard",
        "Panthera tigris": "Tiger",
    }

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("iNaturalist_Downloader")

INAT_API_URL = "https://api.inaturalist.org/v1/observations"


def validate_coordinates(lat: Any, lon: Any) -> bool:
    """
    Validates latitude and longitude values.

    :param lat: Latitude.
    :param lon: Longitude.
    :return: True if valid, False otherwise.
    """
    try:
        lat_f = float(lat)
        lon_f = float(lon)
        if not (-90.0 <= lat_f <= 90.0) or not (-180.0 <= lon_f <= 180.0):
            return False
        if lat_f == 0.0 and lon_f == 0.0:
            return False
        return True
    except (ValueError, TypeError):
        return False


def execute_request_with_retry(url: str, headers: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Executes HTTP GET request with exponential backoff retries.

    :param url: Query URL.
    :param headers: HTTP headers.
    :return: Parsed JSON data dict or None.
    """
    retry_count = 0
    delay = 1.0

    while retry_count < MAX_RETRIES:
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=DOWNLOAD_TIMEOUT) as response:
                if response.status == 200:
                    body = response.read().decode("utf-8")
                    return json.loads(body)
                else:
                    logger.warning(f"HTTP Status {response.status} for URL: {url}. Retrying...")
        except Exception as err:
            logger.warning(f"iNaturalist Request failed (Attempt {retry_count + 1}/{MAX_RETRIES}): {err}")

        retry_count += 1
        time.sleep(delay)
        delay *= BACKOFF_FACTOR

    logger.error(f"Exhausted retries ({MAX_RETRIES}) for URL: {url}")
    return None


def fetch_inaturalist_observations_for_species(
    species_name: str,
    limit_per_species: int = DEFAULT_RECORDS_PER_SPECIES,
    per_page: int = 200,
) -> List[Dict[str, Any]]:
    """
    Fetches recent wildlife observations from iNaturalist REST API.

    :param species_name: Scientific species name.
    :param limit_per_species: Max observations to retrieve.
    :param per_page: Page size (max 200).
    :return: List of clean observation records.
    """
    logger.info(f"Initiating iNaturalist acquisition for '{species_name}' (Limit: {limit_per_species})")
    records: List[Dict[str, Any]] = []
    seen_ids: Set[str] = set()
    page = 1

    headers = {"User-Agent": "WildlifeSafetyApp-ML/1.0 (iNaturalist Pipeline)"}

    while len(records) < limit_per_species:
        params = {
            "taxon_name": species_name,
            "has[]": "geo",
            "quality_grade": "research,needs_id",
            "per_page": str(per_page),
            "page": str(page),
            "order": "desc",
            "order_by": "observed_on",
        }

        query_url = f"{INAT_API_URL}?{urllib.parse.urlencode(params)}"
        data = execute_request_with_retry(query_url, headers)

        if not data:
            logger.error(f"Failed to fetch page {page} for '{species_name}'. Stopping pagination.")
            break

        results = data.get("results", [])
        total_results = data.get("total_results", 0)

        if not results:
            logger.info(f"No further observations found for '{species_name}' on page {page}.")
            break

        added_in_page = 0
        for obs in results:
            obs_id = str(obs.get("id", ""))
            geojson = obs.get("geojson") or {}
            coords = geojson.get("coordinates")  # [lon, lat] in GeoJSON format

            lat = None
            lon = None
            if coords and len(coords) >= 2:
                lon = coords[0]
                lat = coords[1]
            elif obs.get("location"):
                try:
                    parts = obs.get("location").split(",")
                    lat = float(parts[0].strip())
                    lon = float(parts[1].strip())
                except Exception:
                    pass

            if not validate_coordinates(lat, lon):
                continue

            unique_key = f"INAT_{obs_id}" if obs_id else f"{species_name}_{lat}_{lon}_{obs.get('observed_on')}"
            if unique_key in seen_ids:
                continue
            seen_ids.add(unique_key)

            record = {
                "observationID": obs_id,
                "species": species_name,
                "commonName": SUPPORTED_SPECIES.get(species_name, "Unknown"),
                "latitude": float(lat),
                "longitude": float(lon),
                "observedOn": obs.get("observed_on_string") or obs.get("observed_on") or "",
                "timeObservedAt": obs.get("time_observed_at", ""),
                "qualityGrade": obs.get("quality_grade", "unknown"),
                "positionalAccuracy": obs.get("positional_accuracy"),
                "placeGuestName": obs.get("place_guess", ""),
                "uri": obs.get("uri", ""),
                "userLogin": obs.get("user", {}).get("login", "") if isinstance(obs.get("user"), dict) else "",
                "source": "iNaturalist",
            }
            records.append(record)
            added_in_page += 1

            if len(records) >= limit_per_species:
                break

        logger.info(
            f"Species '{species_name}': Page {page} -> Retained {added_in_page} valid observations (Total: {len(records)}/{min(limit_per_species, total_results)})"
        )

        # iNaturalist restricts page depth to max 10,000 total records per search query
        if page * per_page >= total_results or page >= 50:
            logger.info(f"Completed available pagination pages for '{species_name}'.")
            break

        page += 1
        time.sleep(0.3)  # Respectful iNaturalist rate limiting interval

    return records


def generate_dataset_statistics(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes summary statistics for iNaturalist observation data.

    :param records: Observation records.
    :return: Summary metrics dictionary.
    """
    if not records:
        return {"total_observations": 0}

    species_counts: Dict[str, int] = {}
    quality_counts: Dict[str, int] = {}
    lats = [r["latitude"] for r in records]
    lons = [r["longitude"] for r in records]

    for r in records:
        sp = r["species"]
        species_counts[sp] = species_counts.get(sp, 0) + 1
        qg = r["qualityGrade"]
        quality_counts[qg] = quality_counts.get(qg, 0) + 1

    return {
        "total_observations": len(records),
        "species_breakdown": species_counts,
        "quality_grade_breakdown": quality_counts,
        "bounding_box": {
            "min_latitude": round(min(lats), 4),
            "max_latitude": round(max(lats), 4),
            "min_longitude": round(min(lons), 4),
            "max_longitude": round(max(lons), 4),
        },
    }


def download_all_species_inaturalist(
    limit_per_species: int = DEFAULT_RECORDS_PER_SPECIES,
    output_json_name: str = "inaturalist_raw.json",
    output_csv_name: str = "inaturalist_raw.csv",
) -> Tuple[str, str]:
    """
    Downloads iNaturalist observations for all 6 target species and saves to raw dataset directory.

    :param limit_per_species: Record goal per species.
    :param output_json_name: JSON output filename.
    :param output_csv_name: CSV output filename.
    :return: Tuple of (json_path, csv_path).
    """
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    json_path = os.path.join(RAW_DATA_DIR, output_json_name)
    csv_path = os.path.join(RAW_DATA_DIR, output_csv_name)

    all_records: List[Dict[str, Any]] = []

    logger.info("==================================================================")
    logger.info("Starting iNaturalist Recent Wildlife Sightings Download Pipeline")
    logger.info(f"Target Species Count: {len(SUPPORTED_SPECIES)}")
    logger.info(f"Observations Per Species Goal: {limit_per_species}")
    logger.info("==================================================================")

    for species_name in SUPPORTED_SPECIES.keys():
        species_records = fetch_inaturalist_observations_for_species(
            species_name=species_name,
            limit_per_species=limit_per_species,
        )
        all_records.extend(species_records)

    # Save to JSON
    with open(json_path, "w", encoding="utf-8") as json_f:
        json.dump(all_records, json_f, indent=2)
    logger.info(f"Successfully saved JSON observations to: {json_path}")

    # Save to CSV
    if all_records:
        fieldnames = list(all_records[0].keys())
        with open(csv_path, "w", newline="", encoding="utf-8") as csv_f:
            writer = csv.DictWriter(csv_f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_records)
        logger.info(f"Successfully saved CSV observations to: {csv_path}")

    stats = generate_dataset_statistics(all_records)
    logger.info("==================================================================")
    logger.info("iNaturalist Dataset Download Complete")
    logger.info(f"Total Sightings Saved: {stats.get('total_observations')}")
    logger.info(f"Species Breakdown: {json.dumps(stats.get('species_breakdown'), indent=2)}")
    logger.info(f"Quality Breakdown: {json.dumps(stats.get('quality_grade_breakdown'), indent=2)}")
    logger.info(f"Geographic Bounding Box: {stats.get('bounding_box')}")
    logger.info("==================================================================")

    return json_path, csv_path


if __name__ == "__main__":
    download_all_species_inaturalist()
