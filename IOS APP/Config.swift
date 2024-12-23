//
//  Config.swift
//  Card Collector
//
//  Created by Spark_NV on 12/21/24.
//

import Foundation

struct Config {
    static let imageURLList = "https://raw.githubusercontent.com/Spark-NV/Pokemon/refs/heads/main/links"
    static let apiBaseURL = "https://api.pokemontcg.io/v2/cards"
    static let cloudflareWorkerURL = "YOUR APPWORKER"
    static let apiKey = "YOUR API KEY FOR POKEMONTCG"
}


struct PokemonCard: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let images: CardImages
    
    static func == (lhs: PokemonCard, rhs: PokemonCard) -> Bool {
        return lhs.id == rhs.id
    }
}

struct CardImages: Codable, Equatable {
    let small, large: String
}

struct PokemonCardResponse: Codable {
    let data: [PokemonCard]
}
