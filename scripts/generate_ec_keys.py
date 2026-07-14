# generate_ec_keys.py
"""
Generate a secp256k1 EC private/public key pair in PEM format for TrustShare.
Run this script once, then copy the PEM contents into your .env files as needed.
"""
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

# Generate private key
private_key = ec.generate_private_key(ec.SECP256K1())
# Serialize private key to PEM
priv_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)
# Serialize public key to PEM
public_key = private_key.public_key()
pub_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

with open("private_key.pem", "wb") as f:
    f.write(priv_pem)
with open("public_key.pem", "wb") as f:
    f.write(pub_pem)

print("Private key saved to private_key.pem")
print("Public key saved to public_key.pem")
print("\nPaste the following into your .env (replace newlines with \\n):\n")
print(f'RECIPIENT_PRIVKEY_PEM="{priv_pem.decode().replace(chr(10), "\\n")}"')
print(f'TEST_RECIPIENT_PUBKEY="{pub_pem.decode().replace(chr(10), "\\n")}"')
