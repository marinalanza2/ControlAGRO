import UIKit
import Capacitor
import WebKit

class AppViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        webView?.scrollView.scrollIndicatorInsets.top = view.safeAreaInsets.top
    }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        additionalSafeAreaInsets = .zero
        let topInset = view.safeAreaInsets.top
        let bottomInset = view.safeAreaInsets.bottom
        webView?.scrollView.scrollIndicatorInsets.top = topInset
        webView?.scrollView.scrollIndicatorInsets.bottom = bottomInset
        webView?.setNeedsLayout()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
    }
}
