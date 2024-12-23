//
//  CardCollectionViewModel.swift
//  Card Collector
//
//  Created by Spark_NV on 12/21/24.
//

import SwiftUI

class CardCollectionViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var cards = [PokemonCard]()
    @Published var isLoading = false
    @Published var collectedCards: Set<String> = []

    func fetchCards() {
        guard !searchText.isEmpty else { return }
        isLoading = true

        var request = makeRequest("\(Config.apiBaseURL)?q=name:\(searchText)")
        request.setValue("Bearer \(Config.apiKey)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { [weak self] data, _, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                guard let data = data, error == nil else { return }
                if let result = try? JSONDecoder().decode(PokemonCardResponse.self, from: data) {
                    self?.cards = result.data
                    self?.fetchCollectionData()
                }
            }
        }.resume()
    }

    func fetchCollectionData() {
        URLSession.shared.dataTask(with: makeRequest("\(Config.cloudflareWorkerURL)/getCollection")) { [weak self] data, _, error in
            guard let data = data, error == nil,
                  let result = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return }

            DispatchQueue.main.async {
                self?.collectedCards = Set(result.compactMap { $0["collected"] as? Int == 1 ? $0["card_id"] as? String : nil })
            }
        }.resume()
    }

    func fetchCollectedDetails(searchText: String, completion: @escaping (Double) -> Void) {
    guard !searchText.isEmpty else {
        fetchCollectionData { collectedCards in
            let total = collectedCards.compactMap { $0["price"] as? String }
                .compactMap { Double($0) }
                .reduce(0, +)
            completion(total)
        }
        return
    }

        let request = makeRequest("\(Config.apiBaseURL)?q=name:\(searchText)")
        URLSession.shared.dataTask(with: request) { [weak self] data, _, error in
            guard let self = self, let data = data, error == nil,
                  let result = try? JSONDecoder().decode(PokemonCardResponse.self, from: data) else {
                completion(0.0)
                return
            }
    
            let matchingCardIDs = Set(result.data.map { $0.id })
    
            self.fetchCollectionData { collectedCards in
                let total = collectedCards
                    .filter { card in
                        if let cardID = card["card_id"] as? String {
                            return matchingCardIDs.contains(cardID)
                        }
                        return false
                    }
                    .compactMap { $0["price"] as? String }
                    .compactMap { Double($0) }
                    .reduce(0, +)
                completion(total)
            }
        }.resume()
    }

private func fetchCollectionData(completion: @escaping ([[String: Any]]) -> Void) {
    URLSession.shared.dataTask(with: makeRequest("\(Config.cloudflareWorkerURL)/getCollection")) { data, _, error in
        guard let data = data, error == nil,
              let result = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            completion([])
            return
        }
        completion(result)
    }.resume()
}


    private func parsePrice(_ priceString: String) -> Double {
        if let price = Double(priceString) {
            return price
        }
        return 0.0
    }

    private func makeRequest(_ urlString: String) -> URLRequest {
        var request = URLRequest(url: URL(string: urlString)!)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }
}
