import urllib.request
import json

# 1. Login
data = json.dumps({"email": "organizer@hackwell.edu", "password": "organizer123"}).encode()
req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login", data=data, headers={"Content-Type": "application/json"})
res = json.loads(urllib.request.urlopen(req).read().decode())
token = res["access_token"]
print("Login OK, user:", res["name"], "role:", res["role"])

# 2. Get events
headers = {"Authorization": f"Bearer {token}"}
req = urllib.request.Request("http://127.0.0.1:8000/api/events", headers=headers)
events = json.loads(urllib.request.urlopen(req).read().decode())
print(f"Events OK: found {len(events)} events")
for e in events:
    print(f"  - [{e['id']}] {e['name']} ({e['status']})")

# 3. Get resources
req = urllib.request.Request("http://127.0.0.1:8000/api/resources", headers=headers)
resources = json.loads(urllib.request.urlopen(req).read().decode())
print(f"Resources OK: found {len(resources)} resources")

# 4. Run prediction on Event 1
req = urllib.request.Request("http://127.0.0.1:8000/api/predictions/1", headers=headers, method="POST")
pred = json.loads(urllib.request.urlopen(req).read().decode())
print("Prediction on Event 1 OK:", pred)

# 5. Run optimization on Event 1
req = urllib.request.Request("http://127.0.0.1:8000/api/optimization/1", headers=headers, method="POST")
opt = json.loads(urllib.request.urlopen(req).read().decode())
print("Optimization on Event 1 OK: venues:", [v["name"] for v in opt["venues"]], "status:", opt["status"])
print("ALL TESTS PASSED!")
