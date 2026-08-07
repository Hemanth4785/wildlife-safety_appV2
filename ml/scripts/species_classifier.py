"""
Species Validation & Taxonomic Classifier Helper
Validates, maps, and normalizes species queries against the strict 6 supported species list.

Supported Species:
1. Bison bison (American Bison)
2. Bos gaurus (Indian Gaur)
3. Elephas maximus (Asian Elephant)
4. Melursus ursinus (Sloth Bear)
5. Panthera pardus (Leopard)
6. Panthera tigris (Tiger)

Python Version: 3.10.11 / 3.13 Compatible
"""

import logging
import os
import sys
from typing import Dict, List, Optional, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import SUPPORTED_SPECIES
from utils import setup_logger

logger = setup_logger("Species_Classifier")


def validate_and_normalize_species(query_name: str) -> Optional[str]:
    """
    Validates and normalizes any user/API query string into one of the 6 official scientific names.

    :param query_name: Common or scientific species name string.
    :return: Official scientific name or None if unsupported.
    """
    if not query_name or not isinstance(query_name, str):
        return None

    clean_q = query_name.strip().lower()

    # Direct scientific match
    for sci_name in SUPPORTED_SPECIES.keys():
        if sci_name.lower() in clean_q or clean_q in sci_name.lower():
            return sci_name

    # Common name match map
    common_map = {
        "bison": "Bison bison",
        "american bison": "Bison bison",
        "gaur": "Bos gaurus",
        "indian gaur": "Bos gaurus",
        "bison gaurus": "Bos gaurus",
        "elephant": "Elephas maximus",
        "asian elephant": "Elephas maximus",
        "indian elephant": "Elephas maximus",
        "bear": "Melursus ursinus",
        "sloth bear": "Melursus ursinus",
        "leopard": "Panthera pardus",
        "indian leopard": "Panthera pardus",
        "tiger": "Panthera tigris",
        "bengal tiger": "Panthera tigris",
    }

    for key, sci_name in common_map.items():
        if key in clean_q or clean_q in key:
            return sci_name

    logger.warning(f"Species query '{query_name}' failed taxonomic validation. Not in 6 supported species.")
    return None


def get_supported_species_list() -> List[Dict[str, str]]:
    """
    Returns list of all supported species with scientific and common names.
    """
    return [{"scientificName": k, "commonName": v} for k, v in SUPPORTED_SPECIES.items()]


if __name__ == "__main__":
    test_queries = ["elephant", "Panthera tigris", "sloth bear", "lion", "gaur"]
    for q in test_queries:
        res = validate_and_normalize_species(q)
        print(f"Query: '{q}' -> Validated: {res}")
