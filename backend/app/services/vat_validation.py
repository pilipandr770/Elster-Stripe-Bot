"""VAT ID validation service using VIES API."""
import requests
import zeep
import logging
from typing import Dict, Any, Optional, Tuple
from zeep.exceptions import Fault

logger = logging.getLogger(__name__)

class VatValidationService:
    """Service to validate European VAT numbers using VIES"""
    
    WSDL_URL = "https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl"
    
    @classmethod
    def validate_vat(cls, vat_number: str, requester_vat: str = None, requester_name: str = None, requester_country: str = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate a VAT number using the VIES service
        
        Args:
            vat_number: VAT number in format 'CCNNNNNNNNN' where CC is country code
                        and N is the actual number (e.g. 'DE123456789')
            requester_vat: Optional VAT number of the entity making the request
            requester_name: Optional name of the entity making the request
            requester_country: Optional country code of the entity making the request
        
        Returns:
            Tuple containing:
                - Boolean indicating if VAT is valid
                - Dictionary with validation details
        """
        if not vat_number or len(vat_number) < 3:
            return False, {"error": "Invalid VAT number format"}
            
        country_code = vat_number[:2].upper()
        number = vat_number[2:]
        
        try:
            client = zeep.Client(cls.WSDL_URL)
            
            # For actual implementation, some VAT validation services require information
            # about the entity making the request. In production, you would include this.
            # However, the basic VIES service doesn't require this.
            
            # Example of how the request might look with requester information:
            # result = client.service.checkVatApprox(
            #     countryCode=country_code,
            #     vatNumber=number,
            #     requesterCountryCode=requester_country,
            #     requesterVatNumber=requester_vat,
            #     requesterName=requester_name
            # )
            
            # Basic check without requester details
            result = client.service.checkVat(countryCode=country_code, vatNumber=number)
            
            is_valid = bool(result.valid)
            
            details = {
                "valid": is_valid,
                "country_code": country_code,
                "vat_number": number,
                "request_date": result.requestDate,
                "company_name": getattr(result, "name", ""),
                "company_address": getattr(result, "address", ""),
                "requester_info_included": bool(requester_vat or requester_name)
            }
            
            return is_valid, details
            
        except Fault as e:
            logger.error(f"VIES service error: {str(e)}")
            return False, {"error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error validating VAT: {str(e)}")
            return False, {"error": f"Validation service error: {str(e)}"}
            
    @classmethod
    def validate_vat_mock(cls, vat_number: str, requester_vat: str = None, requester_name: str = None, requester_country: str = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Mock implementation for testing purposes
        
        Args:
            vat_number: VAT number (e.g. 'DE123456789')
            requester_vat: Optional VAT number of the entity making the request
            requester_name: Optional name of the entity making the request
            requester_country: Optional country code of the entity making the request
            
        Returns:
            Tuple containing validation result and details
        """
        # Define some test VAT numbers
        valid_vats = {
            "DE123456789": {
                "company_name": "Test GmbH",
                "company_address": "Test Street 1, 10115 Berlin, Germany"
            },
            "FR12345678901": {
                "company_name": "Test SARL",
                "company_address": "1 Rue de Test, 75001 Paris, France"
            },
            "GB123456789": {
                "company_name": "Test Ltd",
                "company_address": "Test Road 1, London, UK"
            }
        }
        
        # Log that we received requester information
        requester_info_provided = {}
        if requester_name:
            requester_info_provided["name"] = requester_name
        if requester_vat:
            requester_info_provided["vat"] = requester_vat
        if requester_country:
            requester_info_provided["country"] = requester_country
        
        if vat_number in valid_vats:
            details = {
                "valid": True,
                "country_code": vat_number[:2],
                "vat_number": vat_number[2:],
                "request_date": "2025-08-23",
                "company_name": valid_vats[vat_number]["company_name"],
                "company_address": valid_vats[vat_number]["company_address"],
                "requester_info_included": bool(requester_info_provided),
                "requester_info": requester_info_provided
            }
            return True, details
        else:
            return False, {
                "valid": False,
                "country_code": vat_number[:2] if len(vat_number) >= 2 else "",
                "vat_number": vat_number[2:] if len(vat_number) >= 2 else "",
                "request_date": "2025-08-23",
                "error": "VAT number not found or invalid",
                "requester_info_included": bool(requester_info_provided),
                "requester_info": requester_info_provided
            }
