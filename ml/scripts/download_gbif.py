"""
GBIF Historical Occurrence Data Downloader
Downloads historical wildlife occurrence records from the GBIF REST API for the 6 target species.

Features:
- Configurable download limit (minimum 5,000 records per species by default).
- Automatic pagination until requested limit is satisfied or endOfRecords is reached.
- Exponential backoff retry mechanism for API request resilience.
- Coordinate validation (-90 to +90 lat, -180 to +180 lon) and deduplication.
- Dual export to JSON and CSV formats in datasets/raw.
- Automated post-download dataset statistics report generation.

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

# Add parent directory to system path for configuration imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config import (
        BACKOFF_FACTOR,
        DEFAULT_RECORDS_PER_SPECIES,
        DOWNLOAD_TIMEOUT,
        GBIF_BATCH_SIZE,
        GBIF_TAXON_KEYS,
        MAX_RETRIES,
        RAW_DATA_DIR,
        SUPPORTED_SPECIES,
    )
except ImportError:
    RAW_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "raw"))
    DEFAULT_RECORDS_PER_SPECIES = 5000
    GBIF_BATCH_SIZE = 300
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
    GBIF_TAXON_KEYS = {
        "Bison bison": 2441176,
        "Bos gaurus": 2441028,
        "Elephas maximus": 2441011,
        "Melursus ursinus": 2433385,
        "Panthera pardus": 5219436,
        "Panthera tigris": 5219426,
    }

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("GBIF_Downloader")

GBIF_API_URL = "https://api.gbif.org/v1/occurrence/search"


def validate_coordinates(lat: Any, lon: Any) -> bool:
    """
    Validates latitude and longitude values.

    :param lat: Latitude value.
    :param lon: Longitude value.
    :return: True if valid, False otherwise.
    """
    try:
        lat_f = float(lat)
        lon_f = float(lon)
        if not (-90.0 <= lat_f <= 90.0) or not (-180.0 <= lon_f <= 180.0):
            return False
        # Reject unverified 0,0 Null Island points
        if lat_f == 0.0 and lon_f == 0.0:
            return False
        return True
    except (ValueError, TypeError):
        return False


def execute_request_with_retry(url: str, headers: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Executes an HTTP GET request with exponential backoff retry handling.

    :param url: Request URL.
    :param headers: Request headers.
    :return: Parsed JSON dictionary or None if request fails.
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
            logger.warning(f"Request failed (Attempt {retry_count + 1}/{MAX_RETRIES}): {err}")

        retry_count += 1
        time.sleep(delay)
        delay *= BACKOFF_FACTOR

    logger.error(f"Exhausted retries ({MAX_RETRIES}) for request: {url}")
    return None


def fetch_gbif_occurrences_for_species(
    species_name: str,
    taxon_key: Optional[int] = None,
    limit_per_species: int = DEFAULT_RECORDS_PER_SPECIES,
    batch_size: int = GBIF_BATCH_SIZE,
) -> List[Dict[str, Any]]:
    """
    Fetches historical occurrence records from GBIF API with pagination, retries, and coordinate validation.

    :param species_name: Scientific name of target species.
    :param taxon_key: Optional GBIF taxon key.
    :param limit_per_species: Target record count (default: 5000).
    :param batch_size: Records per API page (max 300).
    :return: List of validated occurrence record dictionaries.
    """
    logger.info(f"Starting acquisition for '{species_name}' (Target limit: {limit_per_species}, Taxon Key: {taxon_key})")
    records: List[Dict[str, Any]] = []
    seen_ids: Set[str] = set()
    offset = 0

    headers = {"User-Agent": "WildlifeSafetyApp-ML/1.0 (GBIF Pipeline)"}

    while len(records) < limit_per_species:
        fetch_count = min(batch_size, limit_per_species - len(records))
        params = {
            "hasCoordinate": "true",
            "limit": str(fetch_count),
            "offset": str(offset),
        }
        if taxon_key:
            params["taxonKey"] = str(taxon_key)
        else:
            params["scientificName"] = species_name

        query_url = f"{GBIF_API_URL}?{urllib.parse.urlencode(params)}"
        data = execute_request_with_retry(query_url, headers)

        if not data:
            logger.error(f"Failed to retrieve data batch at offset {offset} for {species_name}. Terminating query.")
            break

        results = data.get("results", [])
        is_end_of_records = data.get("endOfRecords", False)

        if not results:
            logger.info(f"No additional records available for {species_name} at offset {offset}.")
            break

        added_in_batch = 0
        for item in results:
            occ_id = str(item.get("key") or item.get("occurrenceID") or "")
            lat = item.get("decimalLatitude")
            lon = item.get("decimalLongitude")

            if not validate_coordinates(lat, lon):
                continue

            # Deduplication check
            unique_key = occ_id if occ_id else f"{species_name}_{lat}_{lon}_{item.get('eventDate')}"
            if unique_key in seen_ids:
                continue
            seen_ids.add(unique_key)

            record = {
                "gbifID": str(item.get("key", "")),
                "occurrenceID": str(item.get("occurrenceID", "")),
                "species": species_name,
                "scientificName": item.get("scientificName", species_name),
                "commonName": SUPPORTED_SPECIES.get(species_name, "Unknown"),
                "latitude": float(lat),
                "longitude": float(lon),
                "eventDate": item.get("eventDate", ""),
                "year": item.get("year"),
                "month": item.get("month"),
                "day": item.get("day"),
                "countryCode": item.get("countryCode", ""),
                "stateProvince": item.get("stateProvince", ""),
                "locality": item.get("locality", ""),
                "basisOfRecord": item.get("basisOfRecord", "UNKNOWN"),
                "coordinateUncertaintyInMeters": item.get("coordinateUncertaintyInMeters"),
                "source": "GBIF",
            }
            records.append(record)
            added_in_batch += 1

            if len(records) >= limit_per_species:
                break

        logger.info(
            f"Species '{species_name}': Offset {offset} -> Retained {added_in_batch} valid records (Total: {len(records)}/{limit_per_species})"
        )

        if is_end_of_records:
            logger.info(f"Reached GBIF endOfRecords flag for species {species_name}.")
            break

        offset += len(results)
        time.sleep(0.1)  # Polite API querying interval

    return records


def generate_dataset_statistics(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates summary statistics for downloaded occurrence data.

    :param records: List of downloaded records.
    :return: Summary statistics dictionary.
    """
    if not records:
        return {"total_records": 0}

    species_counts: Dict[str, int] = {}
    basis_counts: Dict[str, int] = {}
    lats = [r["latitude"] for r in records]
    lons = [r["longitude"] for r in records]
    years = [r["year"] for r in records if r.get("year") is not None]

    for r in records:
        sp = r["species"]
        species_counts[sp] = species_counts.get(sp, 0) + 1
        bor = r["basisOfRecord"]
        basis_counts[bor] = basis_counts.get(bor, 0) + 1

    stats = {
        "total_records": len(records),
        "species_breakdown": species_counts,
        "basis_of_record_breakdown": basis_counts,
        "bounding_box": {
            "min_latitude": round(min(lats), 4),
            "max_latitude": round(max(lats), 4),
            "min_longitude": round(min(lons), 4),
            "max_longitude": round(max(lons), 4),
        },
        "year_range": {
            "min_year": min(years) if years else None,
            "max_year": max(years) if years else None,
        },
    }
    return stats


def download_all_species_gbif(
    limit_per_species: int = DEFAULT_RECORDS_PER_SPECIES,
    output_json_name: str = "gbif_raw.json",
    output_csv_name: str = "gbif_raw.csv",
) -> Tuple[str, str]:
    """
    Downloads GBIF occurrence records for all 6 supported wildlife species, saving to JSON and CSV.

    :param limit_per_species: Target download record limit per species (min 5,000 recommended).
    :param output_json_name: Target JSON filename.
    :param output_csv_name: Target CSV filename.
    :return: Tuple of (json_file_path, csv_file_path).
    """
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    json_path = os.path.join(RAW_DATA_DIR, output_json_name)
    csv_path = os.path.join(RAW_DATA_DIR, output_csv_name)

    all_records: List[Dict[str, Any]] = []

    logger.info("==================================================================")
    logger.info("Starting GBIF Dataset Download Pipeline")
    logger.info(f"Target Species Count: {len(SUPPORTED_SPECIES)}")
    logger.info(f"Records Per Species Goal: {limit_per_species}")
    logger.info("==================================================================")

    for species_name in SUPPORTED_SPECIES.keys():
        taxon_key = GBIF_TAXON_KEYS.get(species_name)
        species_records = fetch_gbif_occurrences_for_species(
            species_name=species_name,
            taxon_key=taxon_key,
            limit_per_species=limit_per_species,
        )
        all_records.extend(species_records)

    # Save to JSON
    with open(json_path, "w", encoding="utf-8") as json_f:
        json.dump(all_records, json_f, indent=2)
    logger.info(f"Successfully saved JSON dataset to: {json_path}")

    # Save to CSV
    if all_records:
        fieldnames = list(all_records[0].keys())
        with open(csv_path, "w", newline="", encoding="utf-8") as csv_f:
            writer = csv.DictWriter(csv_f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_records)
        logger.info(f"Successfully saved CSV dataset to: {csv_path}")

    # Compute & Print Statistics
    stats = generate_dataset_statistics(all_records)
    logger.info("==================================================================")
    logger.info("GBIF Dataset Download & Processing Complete")
    logger.info(f"Total Records Downloaded & Verified: {stats.get('total_records')}")
    logger.info(f"Species Breakdown: {json.dumps(stats.get('species_breakdown'), indent=2)}")
    logger.info(f"Geographic Bounding Box: {stats.get('bounding_box')}")
    logger.info(f"Year Coverage: {stats.get('year_range')}")
    logger.info("==================================================================")

    return json_path, csv_path


if __name__ == "__main__":
    download_all_species_gbif()
