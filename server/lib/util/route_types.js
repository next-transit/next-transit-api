const MODES = {
  '0': 'tram',
  '1': 'subway',
  '2': 'rail',
  '3': 'bus',
  '4': 'ferry',
  '5': 'cable',
  '6': 'gondola',
  '7': 'funicular'
};


function getMode(routeTypeId) {
  return MODES[routeTypeId.toString()] || 'unknown';
}

module.exports = {
  getMode
};
