// Approximate US ZIP3-prefix -> state lookup. Good enough to show a
// friendly "detected state" hint on the form; not authoritative.
// A real address-verification API can replace this later.
const ZIP3_RANGES = [
  [6, 9, "PR", "Puerto Rico"],
  [10, 27, "MA", "Massachusetts"],
  [28, 29, "RI", "Rhode Island"],
  [30, 38, "NH", "New Hampshire"],
  [39, 49, "ME", "Maine"],
  [50, 59, "VT", "Vermont"],
  [60, 69, "CT", "Connecticut"],
  [70, 89, "NJ", "New Jersey"],
  [100, 149, "NY", "New York"],
  [150, 196, "PA", "Pennsylvania"],
  [197, 199, "DE", "Delaware"],
  [200, 205, "DC", "District of Columbia"],
  [206, 219, "MD", "Maryland"],
  [220, 246, "VA", "Virginia"],
  [247, 268, "WV", "West Virginia"],
  [270, 289, "NC", "North Carolina"],
  [290, 299, "SC", "South Carolina"],
  [300, 319, "GA", "Georgia"],
  [320, 349, "FL", "Florida"],
  [350, 369, "AL", "Alabama"],
  [370, 385, "TN", "Tennessee"],
  [386, 397, "MS", "Mississippi"],
  [398, 399, "GA", "Georgia"],
  [400, 427, "KY", "Kentucky"],
  [430, 459, "OH", "Ohio"],
  [460, 479, "IN", "Indiana"],
  [480, 499, "MI", "Michigan"],
  [500, 528, "IA", "Iowa"],
  [530, 549, "WI", "Wisconsin"],
  [550, 567, "MN", "Minnesota"],
  [570, 577, "SD", "South Dakota"],
  [580, 588, "ND", "North Dakota"],
  [590, 599, "MT", "Montana"],
  [600, 629, "IL", "Illinois"],
  [630, 658, "MO", "Missouri"],
  [660, 679, "KS", "Kansas"],
  [680, 693, "NE", "Nebraska"],
  [700, 714, "LA", "Louisiana"],
  [716, 729, "AR", "Arkansas"],
  [730, 749, "OK", "Oklahoma"],
  [750, 799, "TX", "Texas"],
  [800, 816, "CO", "Colorado"],
  [820, 831, "WY", "Wyoming"],
  [832, 838, "ID", "Idaho"],
  [840, 847, "UT", "Utah"],
  [850, 865, "AZ", "Arizona"],
  [870, 884, "NM", "New Mexico"],
  [889, 898, "NV", "Nevada"],
  [900, 961, "CA", "California"],
  [967, 968, "HI", "Hawaii"],
  [970, 979, "OR", "Oregon"],
  [980, 994, "WA", "Washington"],
  [995, 999, "AK", "Alaska"],
];

export function lookupStateFromZip(zip) {
  if (!/^\d{5}$/.test(zip)) return null;

  const prefix = Number(zip.slice(0, 3));
  const match = ZIP3_RANGES.find(([min, max]) => prefix >= min && prefix <= max);
  return match ? { abbreviation: match[2], name: match[3] } : null;
}
