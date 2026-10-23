/**
 * Kenya Country Utils
 */

function formatKenyaMeta(item) {
  if (!item) return '';
  return `${item.vj || 'Swahili'}${item.year ? ' • ' + item.year : ''}`;
}

module.exports = {
  formatKenyaMeta
};
