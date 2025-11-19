from flask import Blueprint, render_template, request, jsonify
from models import db, User

auth_bp = Blueprint("auth", __name__)

# ---- Signup Page ----
@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        data = request.form
        new_user = User(
            firstName=data.get("firstName"),
            lastName=data.get("lastName"),
            mobile=data.get("mobile"),
            email=data.get("email"),
            ageCategory=data.get("ageCategory"),
            country=data.get("country"),
            state=data.get("state")
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Signup successful!"}), 201

    return render_template("signup.html")


# ---- API: Get all countries ----
@auth_bp.route("/api/countries", methods=["GET"])
def get_countries():
    countries = [
        "India", "United States", "United Kingdom", "Canada", "Australia",
        "Germany", "France", "Italy", "Japan", "China", "Brazil", "Russia",
        "Mexico", "South Africa", "Argentina", "Spain", "Netherlands",
        "Sweden", "Norway", "Denmark", "Finland", "New Zealand", "UAE",
        "Saudi Arabia", "Singapore", "Malaysia", "Thailand", "Nepal",
        "Bangladesh", "Pakistan", "Sri Lanka", "Afghanistan"
        # add more if needed
    ]
    return jsonify(countries)


# ---- API: Get states of a country ----
@auth_bp.route("/api/states/<country>", methods=["GET"])
def get_states(country):
    states = {
        "India": ["West Bengal", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"],
        "United States": ["California", "Texas", "New York", "Florida"],
        "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta"],
        "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
        "Australia": ["New South Wales", "Victoria", "Queensland", "Tasmania"]
    }
    return jsonify(states.get(country, []))
