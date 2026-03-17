export const INVESTORS_BY_STATE = {
  karnataka: [],
  maharashtra: [],
  delhi: [],
  'tamil-nadu': [],
  gujarat: [],
  'west-bengal': [],
  telangana: [],
  rajasthan: [],
  'madhya-pradesh': [],
  kerala: [],
}

export const INVESTOR_COUNT_BY_STATE = Object.fromEntries(
  Object.entries(INVESTORS_BY_STATE).map(([state, arr]) => [state, arr.length])
)
