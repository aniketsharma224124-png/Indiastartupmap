// Single source of truth for premium slot limits per state
// Used by IndiaMap, StatePage, and ListingForm
export const STATE_PREMIUM_LIMIT = {
  // Large states — plenty of map space
  'rajasthan':          18,
  'madhya-pradesh':     16,
  'maharashtra':        16,
  'uttar-pradesh':      15,
  'gujarat':            12,
  'karnataka':          10,
  'andhra-pradesh':     8,
  'odisha':             8,
  'chhattisgarh':       8,
  'tamil-nadu':         8,
  'west-bengal':        7,
  'jharkhand':          6,
  'bihar':              6,
  'telangana':          8,
  'kerala':             4,
  'arunachal-pradesh':  4,

  // Medium states
  'assam':              5,
  'himachal-pradesh':   6,
  'uttarakhand':        5,
  'jammu-kashmir':      14,
  'ladakh':             8,
  'punjab':             6,
  'haryana':            5,
  'meghalaya':          2,

  // Small states — limited map space
  'nagaland':           2,
  'manipur':            2,
  'mizoram':            2,
  'tripura':            2,
  'sikkim':             1,
  'goa':                1,

  // Union Territories — tiny on map
  'delhi':              1,
  'puducherry':         1,
  'andaman-nicobar':    1,
  'chandigarh':         1,
  'dadra-nagar-haveli': 1,
  'lakshadweep':        1,
}
