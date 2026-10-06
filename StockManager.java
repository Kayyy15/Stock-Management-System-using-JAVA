import java.util.*;
import java.time.LocalDateTime;

public class StockManager {

    // 1. Models demonstrating OOP & Encapsulation
    static class Product {
        private String sku;
        private String name;
        private double costPrice;
        private int quantity;
        private int minSafetyStock;

        public Product(String sku, String name, double cp, int qty, int minSafetyStock) {
            this.sku = sku; this.name = name; this.costPrice = cp; 
            this.quantity = qty; this.minSafetyStock = minSafetyStock;
        }

        public String getSku() { return sku; }
        public String getName() { return name; }
        public int getQuantity() { return quantity; }
        public double getCostPrice() { return costPrice; }
        public boolean isLowStock() { return quantity < minSafetyStock; }

        public void adjustQuantity(int amount) throws InsufficientStockException {
            if (this.quantity + amount < 0) {
                throw new InsufficientStockException("Fail-Safe Triggered: Cannot drop stock below zero for SKU: " + sku);
            }
            this.quantity += amount;
        }
    }

    static class Transaction {
        private LocalDateTime timestamp;
        private String sku;
        private int change;
        private String user;
        private String reason;

        public Transaction(String sku, int change, String user, String reason) {
            this.timestamp = LocalDateTime.now();
            this.sku = sku; this.change = change; 
            this.user = user; this.reason = reason;
        }

        @Override
        public String toString() {
            return "[" + timestamp + "] SKU: " + sku + " | Change: " + change + " | User: " + user + " | Reason: " + reason;
        }
    }

    // 2. Custom Exception Handling
    static class InsufficientStockException extends Exception {
        public InsufficientStockException(String message) { super(message); }
    }

    // 3. Core Database/Logic Simulation utilizing Data Structures
    private Map<String, Product> inventoryDb = new HashMap<>();
    private List<Transaction> auditLog = new ArrayList<>();

    public void addProduct(Product p) {
        inventoryDb.put(p.getSku(), p);
    }

    // Method handles both Stock IN (positive) and Stock OUT (negative)
    public void processStockAdjustment(String sku, int changeAmount, String username, String reason) {
        Product p = inventoryDb.get(sku);
        if (p == null) {
            System.out.println("Error: SKU not found.");
            return;
        }

        try {
            p.adjustQuantity(changeAmount); // Will throw exception if < 0
            auditLog.add(new Transaction(sku, changeAmount, username, reason));
            System.out.println("Success: Stock updated for " + p.getName());
            
            // Smart Reorder Alert logic
            if (p.isLowStock()) {
                System.out.println("!! ALERT: " + p.getName() + " is below safety levels. Reorder immediately.");
            }
        } catch (InsufficientStockException e) {
            System.out.println(e.getMessage());
        }
    }

    public double calculateTotalValuation() {
        double total = 0;
        for (Product p : inventoryDb.values()) {
            total += (p.getCostPrice() * p.getQuantity());
        }
        return total;
    }

    public void printAuditTrail() {
        System.out.println("\n--- UNBROKEN AUDIT TRAIL ---");
        for (Transaction t : auditLog) {
            System.out.println(t.toString());
        }
    }

    // 4. Main Execution (Driver method to demonstrate code works)
    public static void main(String[] args) {
        StockManager system = new StockManager();

        System.out.println("Initializing Nexus Inventory System...");
        
        // Seeding Data
        system.addProduct(new Product("MCU-001", "Raspberry Pi 4", 3500.0, 15, 5));
        system.addProduct(new Product("SENS-012", "Ultrasonic Sensor", 80.0, 3, 10));

        // Simulating usage
        System.out.println("Total Valuation: Rs." + system.calculateTotalValuation());
        
        // Valid Transaction: Stock In
        system.processStockAdjustment("MCU-001", 10, "admin", "New Shipment Arrived");
        
        // Invalid Transaction: Fail-Safe test
        System.out.println("\nAttempting invalid Stock Out:");
        system.processStockAdjustment("SENS-012", -5, "staff", "Damaged goods");

        // Valid Transaction: Stock Out triggering a Low Stock alert
        System.out.println("\nAttempting valid Stock Out:");
        system.processStockAdjustment("MCU-001", -22, "staff", "Sold to client");

        // Print final trail
        system.printAuditTrail();
    }
}