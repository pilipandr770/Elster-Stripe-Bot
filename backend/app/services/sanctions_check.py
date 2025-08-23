"""Sanctions check service using public sanctions lists."""
import requests
import logging
from typing import Dict, List, Any, Tuple
import time
import re
from datetime import datetime

logger = logging.getLogger(__name__)

class SanctionsCheckService:
    """Service to check entities against public sanctions lists"""
    
    # These would be actual API endpoints in production
    EU_SANCTIONS_API = "https://sanctionsapi.eu/api/v1/search"
    OFAC_SANCTIONS_API = "https://sanctionsapi.ofac.gov/api/v1/search"
    
    @classmethod
    def check_sanctions(cls, entity_name: str, country_code: str = None, vat_id: str = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if an entity is in sanctions lists
        
        Args:
            entity_name: Company or entity name to check
            country_code: Optional country code (e.g. 'DE')
            vat_id: Optional VAT ID
            
        Returns:
            Tuple containing:
                - Boolean indicating if entity is sanctioned
                - Dictionary with details of matches if any
        """
        try:
            # In a real implementation, we would make API calls to the sanctions lists
            # Here we'll simulate with a mock implementation
            return cls.check_sanctions_mock(entity_name, country_code, vat_id)
            
        except Exception as e:
            logger.error(f"Error checking sanctions: {str(e)}")
            return False, {"error": f"Sanctions check service error: {str(e)}"}
    
    @classmethod
    def check_sanctions_mock(cls, entity_name: str, country_code: str = None, vat_id: str = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Mock implementation for sanctions checking
        
        Args:
            entity_name: Company or entity name to check
            country_code: Optional country code (e.g. 'DE') 
            vat_id: Optional VAT ID
            
        Returns:
            Tuple containing sanction status and details
        """
        # Define some test sanctioned entities
        sanctioned_entities = [
            {
                "name": "Sanctioned Entity",
                "name_pattern": r"sanction(ed|s)",
                "country_codes": ["RU", "BY", "IR"],
                "list_name": "EU Restrictive Measures",
                "date_listed": "2022-03-15",
                "reasons": ["Violation of international law", "Support for illegal activities"],
                "source_url": "https://sanctionsmap.eu/#/main/details/1,2"
            },
            {
                "name": "North Korea Trading Co",
                "name_pattern": r"korea.*trading",
                "country_codes": ["KP"],
                "list_name": "OFAC SDN List",
                "date_listed": "2018-05-10",
                "reasons": ["Proliferation of weapons of mass destruction"],
                "source_url": "https://home.treasury.gov/policy-issues/financial-sanctions/sanctions-list-search"
            }
        ]
        
        # Check for sanctions matches
        matches = []
        
        # Convert to lowercase for case-insensitive matching
        entity_name_lower = entity_name.lower()
        
        for entity in sanctioned_entities:
            # Match by name pattern
            if re.search(entity["name_pattern"], entity_name_lower, re.IGNORECASE):
                matches.append(entity)
                continue
                
            # Direct name match
            if entity["name"].lower() in entity_name_lower:
                matches.append(entity)
                continue
                
            # Match by country code if provided
            if country_code and country_code.upper() in entity["country_codes"]:
                # For country matches, we want a closer name match as well
                # to avoid false positives just based on country
                similarity = cls._calculate_name_similarity(entity_name_lower, entity["name"].lower())
                if similarity > 0.5:  # Arbitrary threshold
                    matches.append(entity)
        
        # Format response
        if matches:
            return True, {
                "is_sanctioned": True,
                "matches": [
                    {
                        "entity_name": match["name"],
                        "list_name": match["list_name"],
                        "date_listed": match["date_listed"],
                        "reasons": match["reasons"],
                        "source_url": match["source_url"]
                    } 
                    for match in matches
                ],
                "match_count": len(matches),
                "check_date": datetime.now().isoformat()
            }
        else:
            return False, {
                "is_sanctioned": False,
                "matches": [],
                "match_count": 0,
                "check_date": datetime.now().isoformat()
            }
    
    @staticmethod
    def _calculate_name_similarity(name1: str, name2: str) -> float:
        """
        Calculate similarity between two names (simplified version)
        
        Args:
            name1: First name
            name2: Second name
            
        Returns:
            Float representing similarity (0.0 to 1.0)
        """
        # This is a very simplified version
        # In production, you'd want to use a proper string similarity algorithm
        # like Levenshtein distance, Jaro-Winkler, or cosine similarity with character n-grams
        
        # For now we'll use a naive approach
        words1 = set(name1.lower().split())
        words2 = set(name2.lower().split())
        
        if not words1 or not words2:
            return 0.0
            
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
