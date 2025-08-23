"""Judicial cases and legal proceedings check service."""
import requests
import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

class JudicialCheckService:
    """Service to check for judicial cases and legal proceedings"""
    
    @classmethod
    def check_judicial_cases(cls, entity_name: str, country_code: str = None) -> Dict[str, Any]:
        """
        Check for judicial cases related to an entity
        
        Args:
            entity_name: Company or entity name to check
            country_code: Optional country code (e.g. 'DE')
            
        Returns:
            Dictionary with judicial cases information
        """
        try:
            # In a real implementation, we would search various legal databases
            # Here we'll simulate with a mock implementation
            return cls.check_judicial_cases_mock(entity_name, country_code)
            
        except Exception as e:
            logger.error(f"Error checking judicial cases: {str(e)}")
            return {"error": f"Judicial check service error: {str(e)}"}
    
    @classmethod
    def check_judicial_cases_mock(cls, entity_name: str, country_code: str = None) -> Dict[str, Any]:
        """
        Mock implementation for judicial cases checking
        
        Args:
            entity_name: Company or entity name to check
            country_code: Optional country code (e.g. 'DE')
            
        Returns:
            Dictionary with judicial cases information
        """
        # Define some test data
        entity_name_lower = entity_name.lower()
        
        # Companies with legal cases
        companies_with_cases = {
            "global imports": [
                {
                    "case_number": "C-123/2023",
                    "court": "Landgericht Berlin",
                    "date_filed": (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d"),
                    "description": "Zahlungsverzug - Forderung über 50.000 EUR",
                    "status": "Abgeschlossen",
                    "outcome": "Vergleich"
                }
            ],
            "tech solutions": [
                {
                    "case_number": "P-456/2024",
                    "court": "Amtsgericht München",
                    "date_filed": (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"),
                    "description": "Patentstreit mit Konkurrent",
                    "status": "Laufend",
                    "outcome": None
                },
                {
                    "case_number": "A-789/2023",
                    "court": "Arbeitsgericht Frankfurt",
                    "date_filed": (datetime.now() - timedelta(days=240)).strftime("%Y-%m-%d"),
                    "description": "Arbeitsrechtliche Auseinandersetzung",
                    "status": "Abgeschlossen",
                    "outcome": "Klage abgewiesen"
                }
            ],
            "sanktionierte entität": [
                {
                    "case_number": "S-101/2022",
                    "court": "Europäischer Gerichtshof",
                    "date_filed": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
                    "description": "Verstoß gegen internationale Handelsbestimmungen",
                    "status": "Aktiv",
                    "outcome": None
                },
                {
                    "case_number": "S-102/2022",
                    "court": "Bundesgerichtshof",
                    "date_filed": (datetime.now() - timedelta(days=420)).strftime("%Y-%m-%d"),
                    "description": "Geldwäschevorwürfe",
                    "status": "Aktiv",
                    "outcome": None
                }
            ]
        }
        
        # Look for matches in our test data
        cases = []
        for company_name, company_cases in companies_with_cases.items():
            if company_name in entity_name_lower:
                cases.extend(company_cases)
        
        # Random chance to find a case for any company to simulate database coverage
        if not cases and random.random() < 0.2:  # 20% chance
            cases = [{
                "case_number": f"R-{random.randint(100, 999)}/{random.randint(2020, 2025)}",
                "court": random.choice(["Landgericht Berlin", "Amtsgericht München", "Oberlandesgericht Hamburg"]),
                "date_filed": (datetime.now() - timedelta(days=random.randint(30, 500))).strftime("%Y-%m-%d"),
                "description": random.choice([
                    "Vertragsstreitigkeit", 
                    "Urheberrechtsverletzung", 
                    "Gewährleistungsansprüche"
                ]),
                "status": random.choice(["Laufend", "Abgeschlossen"]),
                "outcome": None if random.random() < 0.5 else random.choice([
                    "Klage abgewiesen", 
                    "Vergleich geschlossen", 
                    "Urteil zugunsten des Klägers"
                ])
            }]
        
        return {
            "entity_name": entity_name,
            "case_count": len(cases),
            "cases": cases,
            "check_date": datetime.now().isoformat()
        }
