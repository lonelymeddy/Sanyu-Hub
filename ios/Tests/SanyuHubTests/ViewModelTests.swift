import XCTest
@testable import SanyuHub

@MainActor
final class ViewModelTests: XCTestCase {
    func testLiveTvViewModelFiltering() {
        let vm = LiveTVViewModel()
        vm.selectType(.kids)

        XCTAssertEqual(vm.selectedType, .kids)
        XCTAssertFalse(vm.channels.isEmpty)
        XCTAssertTrue(vm.channels.allSatisfy { $0.category == "kids" || $0.type == "kids" })
    }

    func testSearchViewModelLocalChannels() async {
        let vm = SearchViewModel()
        await vm.performSearch(query: "NTV")

        XCTAssertFalse(vm.channelResults.isEmpty)
        XCTAssertEqual(vm.channelResults.first?.id, "ntv-uganda")
    }
}
