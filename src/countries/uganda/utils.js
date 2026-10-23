/**
 * Uganda Country Utils
 */

function formatUgandaMeta(item) {
  if (!item) return '';
  return `${item.vj || 'Luganda'}${item.year ? ' • ' + item.year : ''}`;
}

module.exports = {
  formatUgandaMeta
};
