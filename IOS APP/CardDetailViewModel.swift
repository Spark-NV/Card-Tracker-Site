//
//  CardDetailViewModel.swift
//  Card Collector
//
//  Created by Spark_NV on 12/21/24.
//

import SwiftUI

class CardDetailViewModel: ObservableObject {
    @Published var collected = false
    @Published var price = ""
    @Published var selectedGrader = "PGS"
    @Published var selectedGrade = "1"
    @Published var date = Date()
    
    let graders = ["PGS", "PCG", "SGC", "GMA", "BGS", "CGC", "PSA"]
    let grades = ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"]
    
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    func formatPriceInput(_ input: String) -> String {
        let numericString = input.filter { $0.isNumber }
        guard let number = Int(numericString) else { return "00.00" }
        return String(format: "%d.%02d", number / 100, number % 100)
    }
    
    func fetchExistingValues(for cardId: String) {
        URLSession.shared.dataTask(with: URLRequest(url: URL(string: "\(Config.cloudflareWorkerURL)/getCollection")!)) { [weak self] data, _, error in
            guard let self = self,
                  let data = data, error == nil,
                  let result = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
                  let cardData = result.first(where: { $0["card_id"] as? String == cardId }) else { return }
            
            DispatchQueue.main.async {
                self.collected = (cardData["collected"] as? Int ?? 0) == 1
                self.price = cardData["price"] as? String ?? ""
                if let gradeString = cardData["grade"] as? String {
                    let components = gradeString.split(separator: " ")
                    if components.count == 2 {
                        self.selectedGrader = String(components[0])
                        self.selectedGrade = String(components[1])
                    }
                }
                if let dateString = cardData["date"] as? String,
                   let parsedDate = self.dateFormatter.date(from: dateString) {
                    self.date = parsedDate
                }
            }
        }.resume()
    }
    
    func saveChanges(for cardId: String, completion: @escaping (Bool) -> Void) {
        var request = URLRequest(url: URL(string: "\(Config.cloudflareWorkerURL)/updateCollection")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "card_id": cardId,
            "collected": collected ? 1 : 0,
            "price": price,
            "grade": "\(selectedGrader) \(selectedGrade)",
            "date": dateFormatter.string(from: date)
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, _, error in
            DispatchQueue.main.async { completion(error == nil && data != nil) }
        }.resume()
    }
}
