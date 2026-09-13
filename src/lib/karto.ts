/**
 * Kartografer AI — itinerary knowledge base and generator.
 * Faithful port of the original homepage + explore page logic.
 */

export interface VibeData {
  places: string[];
  cafes: string[];
  restaurants: string[];
}

export interface CityData {
  Relaxing?: VibeData;
  Adventure?: VibeData;
  Family?: VibeData;
  Foodie?: VibeData;
  multiplier?: number;
  [vibe: string]: VibeData | number | undefined;
}

export const KARTO_KNOWLEDGE: Record<string, CityData> = {
  Goa: {
    Relaxing: { places: ['Palolem Beach', 'Butterfly Beach', 'Mandrem River'], cafes: ['Artjuna Cafe', 'Eva Cafe', 'Cafe Chocolatti'], restaurants: ['The Lazy Goose', 'Thalassa', 'Olive Bar & Kitchen'] },
    Adventure: { places: ['Grand Island Scuba', 'Dudhsagar Falls', 'Netravali Wildlife'], cafes: ['Lila Cafe', 'Baba Au Rhum', 'Gunj Cafe'], restaurants: ["Curlies", "Fisherman's Wharf", 'Vinayak Family Restaurant'] },
    Family: { places: ['Snow Park', 'Aguada Fort', 'Salim Ali Bird Sanctuary'], cafes: ['Bodega', 'Cafe Alibi'], restaurants: ["Mum's Kitchen", "Martin's Corner", 'Peep Kitchen'] },
    Foodie: { places: ['Mapusa Spice Market', 'Old Goa Bakeries', 'Sahakari Spice Farm'], cafes: ['Bean Me Up', 'G-Shot Coffee'], restaurants: ['Gunpowder', 'Copperleaf', 'Bombil'] },
    multiplier: 3800,
  },
  Manali: {
    Relaxing: { places: ['Vashisht Temple', 'Jogini Falls', 'Hadimba Temple Forest'], cafes: ['Cafe 1947', 'The Lazy Dog', "Johnson's Cafe"], restaurants: ['Chopsticks', 'Renaissance', 'Mount View'] },
    Adventure: { places: ['Solang Paragliding', 'Rohtang Pass', 'Hampta Pass Base'], cafes: ["Dylan's Coffee", "Rocky's Cafe"], restaurants: ['Old Manali Dhaba', 'Fat Plate'] },
    Family: { places: ['Van Vihar Park', 'Club House', 'Manu Temple'], cafes: ['Scoops', "Mom's Kitchen"], restaurants: ['Sher-e-Punjab', 'Sancha Cafe'] },
    Foodie: { places: ['Mall Road Street Food', 'Old Manali Cafes'], cafes: ['The Corner House'], restaurants: ["Il Forno", "Drifter's Inn"] },
    multiplier: 2900,
  },
  Jaipur: {
    Relaxing: { places: ['Galta Ji Temple', 'Sagar Lake', 'Central Park'], cafes: ['Anokhi Cafe', 'Tapri The Tea House'], restaurants: ['Baradari', 'Caffe Palladio'] },
    Adventure: { places: ['Nahargarh Cycle Trek', 'Amber Fort Night Walk'], cafes: ['Stepout Cafe'], restaurants: ['Handi', 'Spice Court'] },
    Family: { places: ['Chokhi Dhani', 'City Palace', 'Jantar Mantar'], cafes: ['The Night Jar'], restaurants: ['Laxmi Mishthan Bhandar', 'Surya Mahal'] },
    Foodie: { places: ['Johri Bazaar', 'Puran Ji Tea Stall'], cafes: ['Curious Life Coffee'], restaurants: ['Rawat Mishthan Bhandar', '1135 AD'] },
    multiplier: 2600,
  },
  Kerala: {
    Relaxing: { places: ['Alleppey Backwaters', 'Varkala Cliff', 'Kumarakom Sanctuary'], cafes: ['Darjeeling Cafe', 'Coffee Temple'], restaurants: ['The Rice Boat', 'Ginger House'] },
    Adventure: { places: ['Munnar Tea Trek', 'Thekkady Jungle Safari'], cafes: ['Munnar Coffee Hub'], restaurants: ['Spice Village', 'Ambady Estate'] },
    multiplier: 3200,
  },
  Bangalore: {
    Relaxing: { places: ['Lalbagh', 'Cubbon Park'], cafes: ['Third Wave', 'Araku Coffee'], restaurants: ["Sunny's", 'The Only Place'] },
    Adventure: { places: ['Nandi Hills', 'Bannerghatta Park'], cafes: ['Dyu Art Cafe'], restaurants: ["Koshy's", 'Empire'] },
    Foodie: { places: ['VV Puram Food Street', 'VV Puram'], cafes: ["Brahmin's Coffee Bar"], restaurants: ['MTR', 'Vidyarthi Bhavan'] },
    multiplier: 2800,
  },
};

export interface ItineraryDay {
  day: number;
  city: string;
  vibe: string;
  place: string;
  cafe: string;
  restaurant: string;
}

export interface ItineraryPlan {
  city: string;
  days: ItineraryDay[];
  stayCost: number;
  localCost: number;
  totalCost: number;
}

export function resolveCity(location: string): string {
  for (const city of Object.keys(KARTO_KNOWLEDGE)) {
    if (location.toLowerCase().includes(city.toLowerCase())) return city;
  }
  return 'Goa';
}

export function generateItinerary(
  location: string,
  days: number,
  guests: number,
  vibe: string,
  stayPricePerNight = 0,
): ItineraryPlan {
  const city = resolveCity(location);
  const cityData = KARTO_KNOWLEDGE[city];
  const vibeData: VibeData =
    (cityData[vibe] as VibeData | undefined) ||
    (cityData['Relaxing'] as VibeData | undefined) || {
      places: ['Local Landmark', 'Scenic Point'],
      cafes: ['Top Rated Cafe', 'Local Brews'],
      restaurants: ['Authentic Dining', "Chef's Table"],
    };

  const plan: ItineraryDay[] = [];
  for (let i = 1; i <= days; i++) {
    plan.push({
      day: i,
      city,
      vibe,
      place: vibeData.places[(i - 1) % vibeData.places.length],
      cafe: vibeData.cafes[(i - 1) % vibeData.cafes.length],
      restaurant: vibeData.restaurants[(i - 1) % vibeData.restaurants.length],
    });
  }

  const stayCost = stayPricePerNight * days;
  const vibeMultiplier = vibe === 'Adventure' ? 1.4 : vibe === 'Foodie' ? 1.3 : 1.0;
  const localDaily = (cityData.multiplier || 2500) * vibeMultiplier;
  const localCost = localDaily * days * guests;

  return { city, days: plan, stayCost, localCost, totalCost: stayCost + localCost };
}

export const DESTINATION_COORDS: Record<string, [number, number]> = {
  Goa: [15.2993, 74.124],
  Manali: [32.2432, 77.1892],
  Jaipur: [26.9124, 75.7873],
  Kerala: [9.4981, 76.3388],
  Chennai: [13.0827, 80.2707],
  Agra: [27.1767, 78.0081],
  Bangalore: [12.9716, 77.5946],
  Shimla: [31.1048, 77.1734],
  Ooty: [11.4102, 76.695],
  Ahmedabad: [23.0225, 72.5714],
  Patna: [25.5941, 85.1376],
};

export function coordsFor(location: string, lat?: number | null, lng?: number | null): [number, number] {
  if (lat && lng) return [lat, lng];
  for (const [name, coords] of Object.entries(DESTINATION_COORDS)) {
    if (location.toLowerCase().includes(name.toLowerCase())) return coords;
  }
  return [20.5937, 78.9629];
}

export const POPULAR_LOCATIONS = [
  { name: 'Goa', desc: 'India · Beachfront Villas & Resorts' },
  { name: 'Manali', desc: 'Himachal Pradesh · Mountain Chalets & Snow Views' },
  { name: 'Jaipur', desc: 'Rajasthan · Heritage Palaces & Havelis' },
  { name: 'Kerala', desc: 'South India · Tranquil Houseboats & Backwaters' },
  { name: 'Chennai', desc: 'Tamil Nadu · Coastal Penthouses' },
  { name: 'Agra', desc: 'Uttar Pradesh · Cozy Apartments near Taj' },
  { name: 'Bangalore', desc: 'Karnataka · Tech Hub Modern Flats' },
  { name: 'Shimla', desc: 'Himachal Pradesh · Hill Station Penthouses' },
  { name: 'Ooty', desc: 'Tamil Nadu · Tea Garden Villas' },
  { name: 'Ahmedabad', desc: 'Gujarat · Heritage City Stays' },
  { name: 'Patna', desc: 'Bihar · Spacious Family 2BHKs' },
];
