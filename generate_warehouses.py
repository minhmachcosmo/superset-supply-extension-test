"""
Generate SQLite database with 20 international warehouses for the Supplychain Warehouse plugin.
Run: python generate_warehouses.py
"""

import sqlite3
from pathlib import Path

WAREHOUSES = [
    # Europe (5)
    (1, "Rotterdam Euro Hub",           "Maasvlakte 2, 3199 Rotterdam, Netherlands",          51.9244,   4.4777, 45000),
    (2, "Frankfurt Central Depot",      "Cargo City Süd, 60549 Frankfurt am Main, Germany",   50.1109,   8.6821, 38000),
    (3, "Paris Distribution Center",    "12 Avenue du Clos, 95700 Roissy-en-France, France",  48.8566,   2.3522, 22000),
    (4, "Barcelona Mediterranean Hub",  "Zona Franca, Carrer B, 08040 Barcelona, Spain",      41.3874,   2.1686, 19000),
    (5, "Warsaw Eastern Gateway",       "ul. Logistyczna 1, 05-082 Warsaw, Poland",           52.2297,  21.0122, 16000),
    # North America (4)
    (6, "Los Angeles West Coast Hub",   "2401 E Dominguez St, Carson, CA 90810, USA",         33.9425, -118.2551, 52000),
    (7, "Chicago Midwest Distribution", "10300 S Torrence Ave, Chicago, IL 60617, USA",       41.8781,  -87.6298, 41000),
    (8, "Houston Gulf Logistics",       "8700 Will Clayton Pkwy, Humble, TX 77338, USA",      29.7604,  -95.3698, 35000),
    (9, "Toronto Canada Hub",           "6750 Winston Churchill Blvd, Mississauga, ON, Canada", 43.6532, -79.3832, 28000),
    # Asia-Pacific (5)
    (10, "Shanghai Pacific Gateway",    "No.1 Gangcheng Rd, Pudong New Area, Shanghai, China",  31.2304, 121.4737, 68000),
    (11, "Singapore ASEAN Hub",         "35 Tanjong Penjuru, Singapore 609025",                  1.3521, 103.8198, 42000),
    (12, "Tokyo Kanto Depot",           "2-1 Aomi, Koto-ku, Tokyo 135-0064, Japan",             35.6762, 139.6503, 31000),
    (13, "Mumbai West India Center",    "JNPT Rd, Uran, Navi Mumbai 400707, India",             19.0760,  72.8777, 37000),
    (14, "Sydney Oceania Warehouse",    "1 Stoney Creek Rd, Bexley NSW 2207, Australia",       -33.8688, 151.2093, 24000),
    # Middle East & Africa (4)
    (15, "Dubai Global Logistics Hub",  "Jebel Ali Free Zone, Dubai, UAE",                      25.2048,  55.2708, 55000),
    (16, "Johannesburg Africa Gateway", "Rand Airport Rd, Germiston 1401, South Africa",       -26.2041,  28.0473, 18000),
    (17, "Cairo North Africa Depot",    "Cairo Logistics Zone, 10th of Ramadan City, Egypt",    30.0444,  31.2357, 14000),
    (18, "Istanbul Crossroads Hub",     "Güneşli Mah. E-5 Karayolu, 34212 Istanbul, Turkey",   41.0082,  28.9784, 26000),
    # Latin America (2)
    (19, "São Paulo LATAM Center",      "Rod. Anhanguera km 28, Cajamar SP 07750-000, Brazil", -23.5505, -46.6333, 33000),
    (20, "Panama Canal Logistics",      "Zona Libre de Colón, Colón 0301, Panama",               9.1050, -79.4023, 21000),
]

CONTINENT_MAP = {
    range(1, 6):   "Europe",
    range(6, 10):  "North America",
    range(10, 15): "Asia-Pacific",
    range(15, 19): "Middle East & Africa",
    range(19, 21): "Latin America",
}

def get_continent(wh_id: int) -> str:
    for r, name in CONTINENT_MAP.items():
        if wh_id in r:
            return name
    return "Unknown"


def create_database() -> None:
    db_path = Path(__file__).parent / "supplychain_warehouses.db"

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS warehouses")
    cursor.execute("""
        CREATE TABLE warehouses (
            id         INTEGER PRIMARY KEY,
            name       TEXT    NOT NULL,
            address    TEXT    NOT NULL,
            latitude   REAL    NOT NULL,
            longitude  REAL    NOT NULL,
            stock_size INTEGER NOT NULL
        )
    """)

    cursor.executemany(
        "INSERT INTO warehouses (id, name, address, latitude, longitude, stock_size) VALUES (?, ?, ?, ?, ?, ?)",
        WAREHOUSES,
    )
    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM warehouses")
    total = cursor.fetchone()[0]
    conn.close()

    print(f"\n✅ Database created: {db_path.absolute()}")
    print(f"📦 Total warehouses: {total}\n")

    counts: dict[str, int] = {}
    for wh_id, name, *_ in WAREHOUSES:
        continent = get_continent(wh_id)
        counts[continent] = counts.get(continent, 0) + 1

    print("🌍 Distribution by continent:")
    for continent, count in counts.items():
        print(f"   {continent:<28} {count} warehouses")

    print(f"\n🔗 Superset URI: sqlite:////app/supplychain_warehouses.db")
    print(f"📋 Table: warehouses")
    print(f"📐 Columns: id, name, address, latitude, longitude, stock_size")


if __name__ == "__main__":
    create_database()
