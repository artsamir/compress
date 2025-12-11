import sqlite3, os
print('usage.db exists?', os.path.exists('usage.db'))
conn = sqlite3.connect('usage.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('tables:', cur.fetchall())
conn.close()
