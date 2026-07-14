# =========================================================================
# BLOCKCHAIN API CLIENT
# =========================================================================
# Client for communicating with separate blockchain API service
# Replaces direct blockchain_integration.py imports
# =========================================================================

import httpx
import logging
from typing import Dict, Any, Optional
import os

logger = logging.getLogger(__name__)

class BlockchainAPIClient:
    """Client for blockchain API service"""
    
    def __init__(self, api_url: str = None):
        self.api_url = api_url or os.getenv("BLOCKCHAIN_API_URL", "http://localhost:8545")
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def health_check(self) -> Dict[str, Any]:
        """Check blockchain service health"""
        try:
            response = await self.client.get(f"{self.api_url}/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"❌ Blockchain health check failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def record_file_upload(self, file_id: str, user_id: str, metadata: dict, digital_signature: str) -> Dict[str, Any]:
        """
        Record file upload on blockchain via API
        Args:
            file_id: Unique file identifier
            user_id: User identifier
            metadata: File metadata
            digital_signature: File digital signature
        Returns:
            Transaction result with hash and status
        """
        try:
            payload = {
                "file_id": file_id,
                "user_id": user_id,
                "metadata": metadata,
                "digital_signature": digital_signature
            }
            logger.info(f"🚀 Calling blockchain API for file upload: {file_id}")
            logger.info(f"Payload for /api/blockchain/upload: {payload}")
            response = await self.client.post(
                f"{self.api_url}/api/blockchain/upload",
                json=payload
            )
            if response.status_code != 200:
                logger.error(f"❌ Blockchain API error: {response.status_code} - {response.text}")
                return await self._fallback_simulation("UPLOAD", payload)
            result = response.json()
            logger.info(f"✅ Blockchain upload successful: {result.get('tx_hash', 'N/A')}")
            return result
        except Exception as e:
            logger.error(f"❌ Blockchain API call failed: {e}")
            return await self._fallback_simulation("UPLOAD", {"file_id": file_id, "user_id": user_id, "error": str(e)})
    
    async def request_file_access(self, file_id: str, requester: str, public_key: str, metadata: dict) -> Dict[str, Any]:
        """Request access to a file via API"""
        try:
            payload = {
                "file_id": file_id,
                "requester": requester,
                "public_key": public_key,
                "metadata": metadata
            }
            response = await self.client.post(
                f"{self.api_url}/api/blockchain/request-access",
                json=payload
            )
            if response.status_code != 200:
                return await self._fallback_simulation("ACCESS_REQUEST", payload)
            return response.json()
        except Exception as e:
            logger.error(f"❌ Access request failed: {e}")
            return await self._fallback_simulation("ACCESS_REQUEST", {"error": str(e)})
    
    async def approve_file_access(self, file_id: str, requester: str, key_ref: str, metadata: dict) -> Dict[str, Any]:
        """Approve access request via API"""
        try:
            payload = {
                "file_id": file_id,
                "requester": requester,
                "key_ref": key_ref,
                "metadata": metadata
            }
            
            response = await self.client.post(
                f"{self.api_url}/api/blockchain/approve-access",
                json=payload
            )
            
            if response.status_code != 200:
                return await self._fallback_simulation("ACCESS_APPROVAL", payload)
            
            return response.json()
            
        except Exception as e:
            logger.error(f"❌ Access approval failed: {e}")
            return await self._fallback_simulation("ACCESS_APPROVAL", {"error": str(e)})
    
    async def get_file_info(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get file information from blockchain via API"""
        try:
            response = await self.client.get(f"{self.api_url}/api/blockchain/file/{file_id}")
            
            if response.status_code != 200:
                return None
                
            return response.json()
            
        except Exception as e:
            logger.error(f"❌ File info query failed: {e}")
            return None
    
    async def has_access(self, file_id: str, user_address: str) -> bool:
        """Check if user has access to file via API"""
        try:
            response = await self.client.get(
                f"{self.api_url}/api/blockchain/access/{file_id}/{user_address}"
            )
            
            if response.status_code != 200:
                return False
                
            result = response.json()
            return result.get("has_access", False)
            
        except Exception as e:
            logger.error(f"❌ Access check failed: {e}")
            return False
    
    async def _fallback_simulation(self, action: str, payload: dict) -> Dict[str, Any]:
        """Fallback simulation when blockchain API unavailable"""
        try:
            # Try simulation endpoint
            response = await self.client.post(
                f"{self.api_url}/api/blockchain/simulate/upload",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                result["status"] = "simulated"
                return result
                
        except Exception:
            pass
        
        # Final fallback - local simulation
        import hashlib
        data = f"{action}_{payload.get('file_id', '')}_{payload.get('user_id', '')}"
        mock_hash = "0x" + hashlib.sha256(data.encode()).hexdigest()[:40]
        
        logger.warning(f"⚠️ Using local simulation for {action}")
        
        return {
            "tx_hash": mock_hash,
            "status": "simulated",
            "action": action,
            "payload": payload,
            "note": "Blockchain API unavailable"
        }
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# =========================================================================
# BACKWARD COMPATIBLE INTEGRATOR
# =========================================================================

class BackwardCompatibleIntegrator:
    """Maintains compatibility with existing blockchain_integrator usage"""
    
    def __init__(self):
        self.api_client = None
    
    def get_client(self):
        if not self.api_client:
            blockchain_api_url = os.getenv("BLOCKCHAIN_API_URL", "http://localhost:8545")
            self.api_client = BlockchainAPIClient(blockchain_api_url)
        return self.api_client
    
    async def record_file_upload(self, file_id: str, user_id: str, metadata: dict, digital_signature: str) -> Dict[str, Any]:
        """Backward compatible method - same interface as original"""
        client = self.get_client()
        return await client.record_file_upload(file_id, user_id, metadata, digital_signature)
    
    async def request_file_access(self, file_id: str, requester: str, public_key: str, metadata: dict) -> Dict[str, Any]:
        """Backward compatible method"""
        client = self.get_client()
        return await client.request_file_access(file_id, requester, public_key, metadata)
    
    async def approve_file_access(self, file_id: str, requester: str, key_ref: str, metadata: dict) -> Dict[str, Any]:
        """Backward compatible method"""
        client = self.get_client()
        return await client.approve_file_access(file_id, requester, key_ref, metadata)

# Global instance for backward compatibility with existing code
blockchain_integrator = BackwardCompatibleIntegrator()