//
//  EditCardView.swift
//  Card Collector
//
//  Created by Spark_NV on 12/21/24.
//

import SwiftUI

struct EditCardView: View {
    let card: PokemonCard
    @StateObject private var viewModel = CardDetailViewModel()
    @FocusState private var focusedField: Field?
    @Environment(\.dismiss) private var dismiss
    
    enum Field: Hashable { case price, grade, date }
    
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                AsyncImage(url: URL(string: card.images.large)) { image in
                    image.resizable()
                        .scaledToFit()
                        .frame(maxWidth: 200)
                        .frame(height: 300)
                        .cornerRadius(8)
                } placeholder: {
                    ProgressView()
                        .frame(width: 200, height: 300)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.bottom)
                
                VStack(alignment: .leading, spacing: 20) {
                    Toggle("Collected", isOn: $viewModel.collected)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Price Paid:")
                        ZStack {
                            TextField("Enter price", text: $viewModel.price)
                                .focused($focusedField, equals: .price)
                                .keyboardType(.numberPad)
                                .padding(10)
                                .background(RoundedRectangle(cornerRadius: 10).fill(Color(.systemGray6)))
                                .onChange(of: viewModel.price) { viewModel.price = viewModel.formatPriceInput($0) }
                            
                            if focusedField == .price {
                                HStack {
                                    Spacer()
                                    Button("Done") {
                                        focusedField = nil
                                    }
                                    .padding(.trailing, 16)
                                }
                            }
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Grade:")
                        HStack {
                            Picker("Grader", selection: $viewModel.selectedGrader) {
                                ForEach(viewModel.graders, id: \.self) { Text($0) }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Picker("Grade", selection: $viewModel.selectedGrade) {
                                ForEach(viewModel.grades, id: \.self) { Text($0) }
                            }
                            .pickerStyle(MenuPickerStyle())
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date Collected:")
                        DatePicker("", selection: $viewModel.date, displayedComponents: .date)
                            .datePickerStyle(CompactDatePickerStyle())
                            .labelsHidden()
                    }
                    
                    Button {
                        viewModel.saveChanges(for: card.id) { success in
                            if success {
                                dismiss()
                            }
                        }
                    } label: {
                        Text("Save Changes")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    .padding(.top)
                }
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
        .gesture(TapGesture().onEnded { focusedField = nil })
        .onAppear { viewModel.fetchExistingValues(for: card.id) }
    }
}
