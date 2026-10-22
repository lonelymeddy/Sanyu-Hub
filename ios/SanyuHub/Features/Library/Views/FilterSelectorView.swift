import SwiftUI

public struct FilterSelectorView: View {
    public let items: [String]
    public let selectedItem: String
    public let onSelect: (String) -> Void

    public init(items: [String], selectedItem: String, onSelect: @escaping (String) -> Void) {
        self.items = items
        self.selectedItem = selectedItem
        self.onSelect = onSelect
    }

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(items, id: \.self) { item in
                    let isSelected = item.lowercased() == selectedItem.lowercased()
                    Button(action: { onSelect(item) }) {
                        Text(item == "all" ? "All VJs" : "VJ \(item.capitalized)")
                            .font(.caption)
                            .fontWeight(isSelected ? .bold : .medium)
                            .foregroundColor(isSelected ? .white : Theme.textSecondary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(isSelected ? Theme.accent : Theme.surface)
                            .cornerRadius(20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(isSelected ? Theme.accent : Theme.border, lineWidth: 1)
                            )
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }
}
