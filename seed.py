from datetime import date, datetime
from app.database import engine, Base, SessionLocal
import app.models  # Register models
from app.models.role import Role
from app.models.department import Department
from app.models.employee import Employee
from app.models.user import User
from app.models.category import AssetCategory
from app.models.supplier import Supplier
from app.models.asset import Asset
from app.models.asset_assignment import AssetAssignment
from app.models.inventory import InventoryItem
from app.models.stock_transaction import StockTransaction
from app.core.security import get_password_hash

def seed_database():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding sample data...")

        # 0. Roles
        roles = [
            Role(role_name="Admin", description="Full system administration and control over users, assets, and configurations"),
            Role(role_name="Warehouse Manager", description="Manages inventory stock transactions, stock-in/out approvals, and suppliers"),
            Role(role_name="Inventory Staff", description="Handles day-to-day asset assignment and stock movement records"),
        ]
        db.add_all(roles)
        db.commit()

        admin_role = db.query(Role).filter(Role.role_name == "Admin").first()
        mgr_role = db.query(Role).filter(Role.role_name == "Warehouse Manager").first()
        staff_role = db.query(Role).filter(Role.role_name == "Inventory Staff").first()

        # 1. Departments
        depts = [
            Department(department_name="IT", description="Information Technology Department", status="Active"),
            Department(department_name="HR", description="Human Resources Department", status="Active"),
            Department(department_name="Finance", description="Finance and Accounting", status="Active"),
            Department(department_name="Marketing", description="Marketing and Communications", status="Active"),
            Department(department_name="Administration", description="General Administration", status="Active"),
        ]
        db.add_all(depts)
        db.commit()

        # 2. Employees
        it_dept = db.query(Department).filter(Department.department_name == "IT").first()
        hr_dept = db.query(Department).filter(Department.department_name == "HR").first()
        admin_dept = db.query(Department).filter(Department.department_name == "Administration").first()

        employees = [
            Employee(department_id=it_dept.department_id, employee_code="EMP-001", employee_name="Dara", email="dara@company.com", phone="012345678", position="Senior IT Support", status="Active"),
            Employee(department_id=it_dept.department_id, employee_code="EMP-002", employee_name="Sokha", email="sokha@company.com", phone="012345679", position="Software Engineer", status="Active"),
            Employee(department_id=it_dept.department_id, employee_code="EMP-003", employee_name="Lina", email="lina@company.com", phone="012345680", position="System Administrator", status="Active"),
            Employee(department_id=hr_dept.department_id, employee_code="EMP-004", employee_name="Bopha", email="bopha@company.com", phone="012345681", position="HR Manager", status="Active"),
            Employee(department_id=admin_dept.department_id, employee_code="EMP-005", employee_name="Vanna", email="vanna@company.com", phone="012345682", position="Admin Officer", status="Active"),
        ]
        db.add_all(employees)
        db.commit()

        # 3. Users
        emp1 = db.query(Employee).filter(Employee.employee_code == "EMP-001").first()
        emp3 = db.query(Employee).filter(Employee.employee_code == "EMP-003").first()
        emp4 = db.query(Employee).filter(Employee.employee_code == "EMP-004").first()

        hashed_pwd = get_password_hash("123456")

        users = [
            User(employee_id=emp1.employee_id, role_id=admin_role.role_id, username="admin", password=hashed_pwd, email="admin@company.com", phone="012345678", gender="Male", status="Active"),
            User(employee_id=emp3.employee_id, role_id=staff_role.role_id, username="staff01", password=hashed_pwd, email="staff01@company.com", phone="012345680", gender="Male", status="Active"),
            User(employee_id=emp4.employee_id, role_id=mgr_role.role_id, username="manager01", password=hashed_pwd, email="manager01@company.com", phone="012345681", gender="Female", status="Active"),
        ]
        db.add_all(users)
        db.commit()

        # 4. Asset Categories
        categories = [
            AssetCategory(category_name="Laptop", description="Company laptop computers", status="Active"),
            AssetCategory(category_name="Desktop", description="Desktop computer workstations", status="Active"),
            AssetCategory(category_name="Printer", description="Office printing machines", status="Active"),
            AssetCategory(category_name="Monitor", description="External display monitors", status="Active"),
            AssetCategory(category_name="Projector", description="Meeting room projectors", status="Active"),
        ]
        db.add_all(categories)
        db.commit()

        # 5. Suppliers
        suppliers = [
            Supplier(supplier_name="ABC Technology", contact_person="Mr. John", phone="012345678", email="abc@tech.com", address="Phnom Penh, Cambodia", status="Active"),
            Supplier(supplier_name="Global Supplies Co.", contact_person="Ms. Sarah", phone="098765432", email="contact@globalsupplies.com", address="Phnom Penh, Cambodia", status="Active"),
            Supplier(supplier_name="TechHub Cambodia", contact_person="Mr. David", phone="011223344", email="sales@techhub.kh", address="Phnom Penh, Cambodia", status="Active"),
        ]
        db.add_all(suppliers)
        db.commit()

        # 6. Assets
        lap_cat = db.query(AssetCategory).filter(AssetCategory.category_name == "Laptop").first()
        prt_cat = db.query(AssetCategory).filter(AssetCategory.category_name == "Printer").first()
        mon_cat = db.query(AssetCategory).filter(AssetCategory.category_name == "Monitor").first()
        sup1 = db.query(Supplier).filter(Supplier.supplier_name == "ABC Technology").first()
        sup2 = db.query(Supplier).filter(Supplier.supplier_name == "Global Supplies Co.").first()

        assets = [
            Asset(category_id=lap_cat.category_id, supplier_id=sup1.supplier_id, asset_code="LAP-001", asset_name="Dell Latitude Laptop 5420", serial_number="DL123456", purchase_date=date(2026, 1, 15), purchase_price=800.00, condition="Good", status="Assigned", description="Assigned laptop"),
            Asset(category_id=lap_cat.category_id, supplier_id=sup1.supplier_id, asset_code="LAP-002", asset_name="HP EliteBook 840 G8", serial_number="HP987654", purchase_date=date(2026, 2, 10), purchase_price=950.00, condition="Excellent", status="Available", description="Backup laptop"),
            Asset(category_id=prt_cat.category_id, supplier_id=sup2.supplier_id, asset_code="PRT-001", asset_name="HP LaserJet Pro MFP", serial_number="HPLJ4455", purchase_date=date(2025, 11, 5), purchase_price=350.00, condition="Good", status="Available", description="Main office printer"),
            Asset(category_id=mon_cat.category_id, supplier_id=sup1.supplier_id, asset_code="MON-001", asset_name="Samsung 27 Inch Monitor", serial_number="SAM7788", purchase_date=date(2026, 3, 1), purchase_price=180.00, condition="Good", status="Available", description="27-inch LED screen"),
        ]
        db.add_all(assets)
        db.commit()

        # 7. Asset Assignments
        user_staff = db.query(User).filter(User.username == "staff01").first()
        asset1 = db.query(Asset).filter(Asset.asset_code == "LAP-001").first()
        emp2 = db.query(Employee).filter(Employee.employee_code == "EMP-002").first()

        assignment = AssetAssignment(
            asset_id=asset1.asset_id,
            employee_id=emp2.employee_id,
            assigned_by=user_staff.user_id,
            assigned_date=date(2026, 8, 1),
            condition_on_assignment="Good",
            status="Assigned",
            remarks="Issued for development work"
        )
        db.add(assignment)
        db.commit()

        # 8. Inventory Items
        sup3 = db.query(Supplier).filter(Supplier.supplier_name == "TechHub Cambodia").first()

        items = [
            InventoryItem(supplier_id=sup2.supplier_id, item_code="INV-001", item_name="Printer Paper A4", category="Office Supplies", unit="Pack", quantity=650, minimum_stock=100, status="Available", description="A4 80gsm paper pack"),
            InventoryItem(supplier_id=sup3.supplier_id, item_code="INV-002", item_name="USB-C Cable 2m", category="IT Accessories", unit="Piece", quantity=15, minimum_stock=30, status="Low Stock", description="Braided USB-C fast charging cable"),
            InventoryItem(supplier_id=sup2.supplier_id, item_code="INV-003", item_name="Blue Ballpoint Pens", category="Office Supplies", unit="Box", quantity=0, minimum_stock=20, status="Out of Stock", description="Box of 50 blue pens"),
            InventoryItem(supplier_id=sup3.supplier_id, item_code="INV-004", item_name="Wireless Optical Mouse", category="IT Accessories", unit="Piece", quantity=120, minimum_stock=25, status="Available", description="Logitech silent wireless mouse"),
        ]
        db.add_all(items)
        db.commit()

        # 9. Stock Transactions
        inv1 = db.query(InventoryItem).filter(InventoryItem.item_code == "INV-001").first()
        inv2 = db.query(InventoryItem).filter(InventoryItem.item_code == "INV-002").first()

        transactions = [
            StockTransaction(inventory_id=inv1.inventory_id, user_id=user_staff.user_id, transaction_type="Stock In", quantity=200, reference="PO-2026-001", reason="New stock received from supplier", remarks="Verified by warehouse"),
            StockTransaction(inventory_id=inv1.inventory_id, user_id=user_staff.user_id, transaction_type="Stock Out", quantity=50, reference="ISS-2026-010", reason="Issued to Administration", remarks="Monthly supply distribution"),
            StockTransaction(inventory_id=inv2.inventory_id, user_id=user_staff.user_id, transaction_type="Stock Out", quantity=10, reference="ISS-2026-011", reason="Issued to IT team", remarks="Requested by Sokha"),
        ]
        db.add_all(transactions)
        db.commit()

        print("Database seeded successfully with initial data!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
