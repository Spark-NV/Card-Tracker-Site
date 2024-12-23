//
//  ContentView.swift
//  Card Collector
//
//  Created by Spark_NV on 12/21/24.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = CardCollectionViewModel()
    @State private var backgroundImageURL: String = ""
    @State private var isSearching: Bool = false
    @State private var navigationTitle: String = "Card Collector"
    @State private var totalCollectedPrice: Double = 0.0
    @State private var collectionStatus: String = ""

    var body: some View {
        NavigationView {
            VStack {
                TextField("Search Pokémon", text: $viewModel.searchText, onCommit: viewModel.fetchCards)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding()
                    .disableAutocorrection(true)
                    .autocapitalization(.none)
                    .submitLabel(.search)
                    .onSubmit {
                        viewModel.fetchCards()
                        isSearching = true
                        updateNavigationTitle()
                        updateTotalCollectedPrice()
                    }
                    .background(Color.blue.opacity(0.2))
                    .cornerRadius(8)
                    .padding(.horizontal)

                if !viewModel.searchText.isEmpty && isSearching {
                    Text(collectionStatus)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .padding(.horizontal)
                }

                if viewModel.isLoading {
                    ProgressView("Loading...")
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            ForEach(viewModel.cards) { card in
                                NavigationLink(destination: EditCardView(card: card)) {
                                    CardView(card: card, isCollected: viewModel.collectedCards.contains(card.id))
                                }
                            }
                        }
                        .padding()
                    }
                }

                Spacer()

                Text("Total Collected Price: $\(totalCollectedPrice, specifier: "%.2f")")
                    .padding()
                    .font(.headline)
                    .foregroundColor(.white)
                    .background(Color.blue)
                    .cornerRadius(8)
                    .padding(.bottom)
            }
            .background(
                Group {
                    if isSearching {
                        Color.black.edgesIgnoringSafeArea(.all)
                    } else {
                        AsyncImage(url: URL(string: backgroundImageURL)) { image in
                            image.resizable()
                                .scaledToFill()
                                .scaleEffect(0.65)
                                .animation(.easeInOut(duration: 5), value: backgroundImageURL)
                                .edgesIgnoringSafeArea(.all)
                        } placeholder: {
                            Color.gray
                        }
                    }
                }
            )
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                viewModel.fetchCollectionData()
                fetchBackgroundImageURL()
                startBackgroundImageTimer()
                updateTotalCollectedPrice()
            }
            .onChange(of: viewModel.searchText) { _ in
                if viewModel.searchText.isEmpty {
                    navigationTitle = "Card Collector"
                }
                isSearching = false
                updateTotalCollectedPrice()
            }
            .onChange(of: viewModel.cards) { _ in
                updateCollectionStatus()
                
            }
            .onChange(of: viewModel.collectedCards) { _ in
                updateCollectionStatus()
            }
        }
    }

    private func fetchBackgroundImageURL() {
        guard let url = URL(string: Config.imageURLList) else { return }

        let task = URLSession.shared.dataTask(with: url) { data, _, _ in
            if let data = data, let content = String(data: data, encoding: .utf8) {
                let lines = content.split(separator: "\n")
                let imageURLs = lines.map { String($0) }.filter { $0.isValidURL }

                if let randomURL = imageURLs.randomElement() {
                    DispatchQueue.main.async {
                        backgroundImageURL = randomURL
                    }
                }
            }
        }
        task.resume()
    }

    private func startBackgroundImageTimer() {
        Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { _ in
            fetchBackgroundImageURL()
        }
    }

    private func updateNavigationTitle() {
        if !viewModel.searchText.isEmpty {
            navigationTitle = viewModel.searchText.capitalized
            updateCollectionStatus()
        }
    }

    private func updateTotalCollectedPrice() {
        viewModel.fetchCollectedDetails(searchText: viewModel.searchText) { totalPrice in
            totalCollectedPrice = totalPrice
        }
    }

    private func updateCollectionStatus() {
        let totalCards = viewModel.cards.count
        let collectedCount = viewModel.cards.filter { viewModel.collectedCards.contains($0.id) }.count
        collectionStatus = "\(collectedCount) out of \(totalCards) \(viewModel.searchText.capitalized) collected"
    }
}

extension String {
    var isValidURL: Bool {
        return URL(string: self) != nil
    }
}
