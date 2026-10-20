# Sri Lanka Travel Itinerary Planner (Random Forest)

A web app that turns a traveller's request into a full itinerary using three trained
Random-Forest models. Its inputs are arrival and departure (date + time), budget, the
experience wanted, comfort level and meal plan (BB / HB / FB).

## Run it

```bash
pip install -r requirements.txt
python app.py                # open http://127.0.0.1:5000
```

The trained models are already in `models/`. On first run the app creates `app.db` (users and
saved trips) and a secret key in `models/.secret_key`. For a real deployment, set the
`SECRET_KEY` environment variable and run behind a production server (e.g. gunicorn).

## The web app

* **Sign in / create account:** passwords are stored hashed. Each user's trip is saved, so it
  is still there after signing out and back in.
* **Header and footer tabs:** Home, Itinerary, Wellness, Risk analyst, SOS.
  * **Home:** a welcome, plus every attraction from `attractions.xlsx` with search, category
    filters, and details (description, moods, activities, best months).
  * **Itinerary:** where the models run. It has a vertical menu:
    * **My plan:** the trip form (arrival and departure date and time, budget, experience
      message, comfort level, meal plan), then the generated itinerary. Each attraction shows
      its time slot, a description and its activities. Each night shows its hotel. Selected
      guides and agencies appear as "Your trip team", and selected shops appear on nearby days
      and in the departure-day shopping time. It also has an Excel download.
    * **Budget:** the total budget split into Accommodation 40%, Food 20%, Travel 20%,
      Shopping 10% and Other 10% (`DEFAULT_SPLIT` in `app.py`). The user can change it with
      sliders. The Accommodation amount is what the accommodation model receives, and saving
      a new accommodation share re-plans the stays.
    * **Tour guides, Travel agencies, Shopping:** searchable lists from `tourist_guides.csv`,
      `travel_agencies.xlsx` and `business_directory.xlsx`, sorted by distance to your
      itinerary. "Add to my trip" puts them in the itinerary.
  * **Wellness, Risk analyst:** placeholder pages, ready for those modules.
  * **SOS:** Sri Lankan emergency numbers, plus your hotels', guide's and agency's contacts.

Comfort levels shown to users map to the model's levels as follows: Budget→Budget,
Standard→Standard, Mid-range→Comfort, Luxury→Luxury (`COMFORT_OPTIONS` in `app.py`).

## Retrain

The models learn from the user requests and labels in `training_data/`. To update them,
add new labelled rows to those workbooks and run:

```bash
python train_models.py               # ~8 min: trains + evaluates all models
python train_models.py --slot-only   # ~4 min: retrain only the visit-time model
python train_models.py --hotels-only # ~2 min: retrain only the accommodation model
```

### Training workbooks

| Workbook | Sheet | What a row is |
|---|---|---|
| `attraction_training.xlsx` | Message Intents | A user message with its travel month, category and mood |
| `attraction_training.xlsx` | Attraction Training | A user message paired with an attraction slot, labelled Relevance 0–3 |
| `accommodation_training.xlsx` | Accommodation Training | A stay request (comfort, meal plan, budget, location) paired with a hotel, labelled Suitability 0–2 |
| `visit_time_training.xlsx` | Sample Itineraries | The attractions a user visited on one day, in order, with start/end times |
| `final_itinerary_samples.xlsx` | Final Itineraries | Complete itineraries; also defines the Excel download columns |

Keep the same column names when adding rows. `Sample ID` / `Scenario ID` must be unique per request.

## How it works

| Model | Learns from | Inputs (features) | Output |
|---|---|---|---|
| **1. Attraction RF** (+ 2 intent RFs) | `attraction_training.xlsx` | User message vs attraction name, category, mood, activities and details (TF-IDF, character n-grams, semantic LSA, activity overlap), message→mood and message→category probabilities, rating, in-season month | Relevance 0–3 for every attraction slot |
| **2. Accommodation RF** | `accommodation_training.xlsx` | Distance to the day's attractions, price for the chosen BB/HB/FB, budget per night, rating, rating count, hotel category, user comfort level | Suitability 0–2 for every hotel |
| **3. Visit-time RF** | `visit_time_training.xlsx` | Slot mood vs user mood, attraction score, rating, start time, gap, transfer distance, what is still possible later in the day, what would be skipped | Next slot to take, or stop |

`planner.py` assembles the itinerary in the same format as `final_itinerary_samples.xlsx`:

* **Arrival day:** airport → hotel near the first day's attractions. No attractions.
* **Each full day:** attractions with model-chosen, non-overlapping start/end times; activities and details; tonight's hotel.
* **Departure day:** check-out, shopping / free time, airport transfer. No attractions.
* **Hotels:** nights × price for the chosen meal plan, with address, phone, mobile, email and web.

The Excel download uses exactly the columns of `final_itinerary_samples.xlsx`.

## Files

```
app.py                     Flask backend: sign-in, saved trips, budget split, guides/agencies/shops, export
directory.py               Tour guides, travel agencies and shops: cleaning, locating, searching
static/index.html          Frontend (single page: sign-in, Home, Itinerary, Wellness, Risk analyst, SOS)
common.py                  Data cleaning, location matching, feature engineering
planner.py                 Itinerary assembly (shared by training samples and the live models)
models.py                  Trained RF models used at run time
train_models.py            Trains and evaluates the models -> models/
data/attractions.xlsx      Your original attractions file
data/accommodation.xlsx    Your original accommodation file
data/places_gazetteer.xlsx Town coordinates (editable; make_gazetteer.py rebuilds it)
data/attractions-images.xlsx, accommodation-images.xlsx   Photos for the app's cards
data/tourist_guides.csv, travel_agencies.xlsx, business_directory.xlsx
training_data/*.xlsx       The 4 training datasets (user requests + labels)
models/metrics.json        Held-out evaluation results
```

## Results on held-out data

| Measure | Score |
|---|---|
| Message → mood | 88% |
| Message → category | 76% |
| Attraction ranking NDCG@10 | 0.86 |
| Top-5 attractions that fully match | 71% |
| Top hotel is suitable (near, in budget, right comfort) | 100% |
| Top hotel is the single best choice | 95% |
| Budget too small for any nearby stay: top pick is from the cheapest tier | 98% |
| Visit-time step accuracy (exact slot match or correct stop) | 53% |

## Important notes

* **Training data:** the models are only as good as the labelled user requests in
  `training_data/`. More requests, especially for moods and categories with few rows, give
  the biggest improvement. Retrain after adding them.
* **No coordinates exist in the original files.** Locations come from
  `places_gazetteer.xlsx` (182 towns, approximate). 844 of 921 hotels were matched; the
  rest have no price, no rating or an unrecognised address. Add towns to the gazetteer to
  match more.
* **Budget** is the total accommodation budget for all nights, for one room.
* **Transfer times** assume 35 km/h average road speed with a 20-minute minimum between
  attractions. Change this in `CONFIG` in `common.py`.
* **The visit-time model is the weakest.** It sometimes stops a day early. More sample
  itineraries will help most.
* **Guides data:** the guides file had 727 duplicate registrations and some language cells
  containing spilled address or phone text. Duplicates are removed, and only real language
  names are kept. 1,983 of 2,907 guides could be placed on the map; the others still appear
  in search, after the located ones.
* **SOS numbers:** these are the commonly published Sri Lankan numbers (119, 1990, 110, 1912
  and the Colombo Tourist Police). Confirm them before relying on them.
* **When the accommodation share is too small:** if no stay near the route fits the share,
  the accommodation model picks the cheapest well-rated places instead. The app then says so
  and shows the minimum percentage needed to cover them.
