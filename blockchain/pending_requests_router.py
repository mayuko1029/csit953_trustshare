from typing import List, Dict, Any
from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Query

from web3 import Web3
import json

router = APIRouter()

@router.get("/api/blockchain/access-requests/pending")
async def get_pending_access_requests(limit: int = Query(5, description="Number of latest pending requests to return")) -> List[Dict[str, Any]]:
    from blockchain_api import blockchain, logger  # moved import inside function to avoid circular import
    """
    Return the latest N pending access requests (not yet approved) from blockchain events.
    """
    try:
        if not blockchain.contract:
            raise HTTPException(status_code=503, detail="Contract not loaded")

        # Get AccessRequestedDetailed events
        event_abi = None
        for abi in blockchain.contract.abi:
            if abi.get("type") == "event" and abi.get("name") == "AccessRequestedDetailed":
                event_abi = abi
                break
        if not event_abi:
            raise HTTPException(status_code=500, detail="AccessRequestedDetailed event ABI not found")

        # Correct event signature for topics (must match ABI exactly)
        event_signature = "AccessRequestedDetailed(bytes32,address,string,string)"
        event_signature_hash = Web3.keccak(text=event_signature).hex()
        if not event_signature_hash.startswith("0x"):
            event_signature_hash = "0x" + event_signature_hash
        logger.info(f"[DEBUG] Using contract address: {blockchain.contract.address}")
        logger.info(f"[DEBUG] Using event signature: {event_signature}")
        logger.info(f"[DEBUG] Using event signature hash: {event_signature_hash}")
        # Get latest block
        latest_block = blockchain.w3.eth.block_number
        # Query logs for AccessRequestedDetailed events
        logs = blockchain.w3.eth.get_logs({
            "fromBlock": 0,
            "toBlock": latest_block,
            "address": blockchain.contract.address,
            "topics": [event_signature_hash]
        })
        logger.info(f"[DEBUG] AccessRequestedDetailed logs found: {len(logs)}")
        for idx, raw_log in enumerate(logs):
            logger.info(f"[DEBUG] Raw log {idx}: {raw_log}")
        # Parse logs
        pending_requests = []
        for log in reversed(logs):
            try:
                event = blockchain.contract.events.AccessRequestedDetailed().process_log(log)
                file_hash = event.args.fileHash.hex() if hasattr(event.args.fileHash, 'hex') else str(event.args.fileHash)
                requester = event.args.requester
                file_id = event.args.fileId if hasattr(event.args, 'fileId') else None
                message = event.args.message if hasattr(event.args, 'message') else None
                # If message contains JSON with a file_id, prefer that (shortened to 16 chars)
                try:
                    msg_obj = json.loads(message) if message else {}
                except Exception:
                    msg_obj = {}
                if not file_id:
                    fid = msg_obj.get("file_id") or msg_obj.get("fileId")
                    if fid and isinstance(fid, str):
                        # take first 16 characters as frontend expects short version
                        file_id = fid[:16]
                # fallback: derive short id from file_hash if still missing
                if not file_id and file_hash:
                    # file_hash may be a long hex string; strip 0x and take first 16 chars
                    fh = file_hash[2:] if str(file_hash).startswith("0x") else str(file_hash)
                    file_id = fh[:16]
                else:
                    # ensure shortened form
                    file_id = str(file_id)[:16]
                # Check if request is still pending (not approved)
                req = blockchain.contract.functions.requests(event.args.fileHash, requester).call()
                approved = req[2]
                exists = req[3]
                if not approved and exists:
                    pending_requests.append({
                        "file_hash": file_hash,
                        "requester": requester,
                        "file_id": file_id,
                        "message": message
                    })
                if len(pending_requests) >= limit:
                    break
            except Exception as e:
                logger.warning(f"Failed to process event log: {e}")
        logger.info(f"[DEBUG] Pending requests parsed: {pending_requests}")
        return pending_requests[:limit]
    except Exception as e:
        logger.error(f"❌ get_pending_access_requests failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
