//
//  CardView.swift
//  Card Collector
//
//  Created by Spark_NV on 12/21/24.
//

import SwiftUI

struct CardView: View {
    let card: PokemonCard
    let isCollected: Bool
    
    var body: some View {
        VStack {
            AsyncImage(url: URL(string: card.images.large)) { image in
                image.resizable()
                    .scaledToFit()
                    .frame(width: 150, height: 200)
                    .cornerRadius(8)
                    .border(isCollected ? Color.green : Color.clear, width: 8)
            } placeholder: {
                ProgressView()
                    .frame(width: 150, height: 200)
            }
            Text(card.name).font(.headline).lineLimit(1)
        }
    }
}
