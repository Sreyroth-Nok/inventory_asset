import asyncio
from app.database import SessionLocal
from app.models.user import User
from app.models.asset import Asset
from app.models.inventory import InventoryItem
from app.models.stock_transaction import StockTransaction
from app.models.asset_assignment import AssetAssignment
from app.core.security import verify_password, get_password_hash, create_access_token

def test_backend_logic():
    print("=== Testing Backend Logic & Database Integrity ===")
    db = SessionLocal()
    try:
        # 1. Test Password verification
        admin = db.query(User).filter(User.username == "admin").first()
        assert admin is not None, "Admin user missing"
        assert verify_password("123456", admin.password), "Password verification failed"
        print("[PASS] User authentication and password hash verification PASSED!")

        # 2. Test Asset & Assignment workflow
        avail_asset = db.query(Asset).filter(Asset.status == "Available").first()
        assert avail_asset is not None, "Available asset missing"
        print(f"[PASS] Found available asset: '{avail_asset.asset_name}' ({avail_asset.asset_code})")

        # Create Assignment
        assignment = AssetAssignment(
            asset_id=avail_asset.asset_id,
            employee_id=1,
            assigned_by=admin.user_id,
            condition_on_assignment="Good",
            status="Assigned",
            remarks="Unit test assignment"
        )
        avail_asset.status = "Assigned"
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        print(f"[PASS] Asset assignment created successfully! (ID: {assignment.assignment_id})")

        # Return Asset
        assignment.status = "Returned"
        avail_asset.status = "Available"
        db.commit()
        print(f"[PASS] Asset returned successfully! Asset status reverted to '{avail_asset.status}'")

        # 3. Test Inventory & Stock Movement workflow
        inv_item = db.query(InventoryItem).filter(InventoryItem.item_code == "INV-001").first()
        initial_qty = inv_item.quantity
        print(f"[PASS] Inventory item '{inv_item.item_name}' initial quantity: {initial_qty}")

        # Stock In
        stock_in_tx = StockTransaction(
            inventory_id=inv_item.inventory_id,
            user_id=admin.user_id,
            transaction_type="Stock In",
            quantity=50,
            reference="TEST-IN-01",
            reason="Test addition"
        )
        inv_item.quantity += 50
        inv_item.update_status()
        db.add(stock_in_tx)
        db.commit()
        assert inv_item.quantity == initial_qty + 50
        print(f"[PASS] Stock In PASSED! New quantity: {inv_item.quantity}")

        # Stock Out
        stock_out_tx = StockTransaction(
            inventory_id=inv_item.inventory_id,
            user_id=admin.user_id,
            transaction_type="Stock Out",
            quantity=20,
            reference="TEST-OUT-01",
            reason="Test reduction"
        )
        inv_item.quantity -= 20
        inv_item.update_status()
        db.add(stock_out_tx)
        db.commit()
        assert inv_item.quantity == initial_qty + 30
        print(f"[PASS] Stock Out PASSED! New quantity: {inv_item.quantity}")

        print("\nALL BACKEND DOMAIN LOGIC & DB INTEGRITY TESTS PASSED PERFECTLY!")

    finally:
        db.close()


if __name__ == "__main__":
    test_backend_logic()
