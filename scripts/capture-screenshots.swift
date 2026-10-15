import Foundation
import WebKit
import Cocoa

struct CaptureTarget {
    let htmlPath: String
    let outPath: String
}

let args = CommandLine.arguments
guard args.count >= 3 else {
    print("Usage: capture-screenshots.swift <input-html-file> <output-png-file>")
    exit(1)
}

let inputUrl = URL(fileURLWithPath: args[1])
let outputUrl = URL(fileURLWithPath: args[2])

let app = NSApplication.shared
let webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 1200, height: 800))
webView.loadFileURL(inputUrl, allowingReadAccessTo: inputUrl.deletingLastPathComponent())

var finished = false
class NavDelegate: NSObject, WKNavigationDelegate {
    let outUrl: URL
    init(outUrl: URL) {
        self.outUrl = outUrl
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Wait 1.0s for styles, fonts, and scripts to settle
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            let config = WKSnapshotConfiguration()
            config.rect = NSRect(x: 0, y: 0, width: 1200, height: 800)
            webView.takeSnapshot(with: config) { image, error in
                if let image = image,
                   let tiff = image.tiffRepresentation,
                   let rep = NSBitmapImageRep(data: tiff),
                   let png = rep.representation(using: .png, properties: [:]) {
                    try? png.write(to: self.outUrl)
                    print("WROTE: \(self.outUrl.path)")
                } else {
                    print("FAILED to capture snapshot: \(String(describing: error))")
                }
                finished = true
            }
        }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("NAVIGATION FAILED: \(error)")
        finished = true
    }
}

let delegate = NavDelegate(outUrl: outputUrl)
webView.navigationDelegate = delegate

let start = Date()
while !finished && Date().timeIntervalSince(start) < 8 {
    RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 0.1))
}
