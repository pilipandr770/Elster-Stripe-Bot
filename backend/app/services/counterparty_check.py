"""Counterparty check service that combines various checks."""
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

from .vat_validation import VatValidationService
from .sanctions_check import SanctionsCheckService
from .judicial_check import JudicialCheckService

logger = logging.getLogger(__name__)

class CounterpartyCheckService:
    """Service to perform comprehensive checks on counterparties"""
    
    @classmethod
    def check_counterparty(cls, 
                           name: str, 
                           vat_id: Optional[str] = None, 
                           country_code: Optional[str] = None,
                           checker_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Perform a comprehensive check on a counterparty
        
        Args:
            name: Company or entity name
            vat_id: Optional VAT ID (format: 'CCNNNNNNNNN')
            country_code: Optional country code (e.g. 'DE')
            checker_profile: Optional information about the entity performing the check
            
        Returns:
            Dictionary with comprehensive check results
        """
        results = {
            "counterparty_name": name,
            "check_date": datetime.now().isoformat(),
            "overall_status": "unknown",  # Default status
            "checks": {},
            "checker_info": checker_profile or {}
        }
        
        # Extract country_code from VAT ID if not provided
        if not country_code and vat_id and len(vat_id) >= 2:
            country_code = vat_id[:2].upper()
        
        # Extract checker profile information
        requester_vat = None
        requester_name = None
        requester_country = None
        if checker_profile:
            requester_vat = checker_profile.get("vat_id")
            requester_name = checker_profile.get("company_name")
            requester_country = checker_profile.get("country")
            if requester_country and len(requester_country) >= 2:
                requester_country = requester_country[:2].upper()
        
        # 1. VAT validation check
        if vat_id:
            is_valid_vat, vat_details = VatValidationService.validate_vat_mock(
                vat_id, 
                requester_vat=requester_vat,
                requester_name=requester_name,
                requester_country=requester_country
            )
            results["checks"]["vat_validation"] = vat_details
            
            # If VAT is valid, we can use the company details
            if is_valid_vat and "company_name" in vat_details and vat_details["company_name"]:
                # Use the official name for other checks if possible
                official_name = vat_details["company_name"]
                results["official_name"] = official_name
                # Use the official name for further checks if it's available
                name_for_checks = official_name
            else:
                name_for_checks = name
        else:
            results["checks"]["vat_validation"] = {
                "valid": False, 
                "error": "No VAT ID provided",
                "requester_info_included": bool(requester_vat or requester_name),
            }
            name_for_checks = name
        
        # 2. Sanctions check
        is_sanctioned, sanctions_details = SanctionsCheckService.check_sanctions(name_for_checks, country_code, vat_id)
        results["checks"]["sanctions_check"] = sanctions_details
        
        # 3. Judicial cases check
        judicial_cases = JudicialCheckService.check_judicial_cases(name_for_checks, country_code)
        results["checks"]["judicial_check"] = judicial_cases
        
        # 4. Determine overall status
        if is_sanctioned:
            results["overall_status"] = "sanctioned"
        elif vat_id and not results["checks"]["vat_validation"].get("valid", False):
            results["overall_status"] = "warning"
        elif judicial_cases.get("case_count", 0) > 0:
            results["overall_status"] = "warning"
        elif vat_id and results["checks"]["vat_validation"].get("valid", False):
            results["overall_status"] = "verified"
        
        return results
