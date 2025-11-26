//
//  LibraryView.swift
//  Design Premium Music Organizer
//
//  Main library view showing all tracks
//

import SwiftUI
import SwiftData

struct LibraryView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \MusicTrack.dateAdded, order: .reverse) private var tracks: [MusicTrack]
    @State private var showingImporter = false
    @State private var searchText = ""
    @State private var sortOption: SortOption = .dateAdded
    
    enum SortOption: String, CaseIterable {
        case dateAdded = "Date Added"
        case title = "Title"
        case artist = "Artist"
        case album = "Album"
    }
    
    var filteredTracks: [MusicTrack] {
        let filtered = searchText.isEmpty ? tracks : tracks.filter {
            $0.title.localizedCaseInsensitiveContains(searchText) ||
            $0.artist.localizedCaseInsensitiveContains(searchText) ||
            $0.album.localizedCaseInsensitiveContains(searchText)
        }
        
        return filtered.sorted { track1, track2 in
            switch sortOption {
            case .dateAdded:
                return track1.dateAdded > track2.dateAdded
            case .title:
                return track1.title < track2.title
            case .artist:
                return track1.artist < track2.artist
            case .album:
                return track1.album < track2.album
            }
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if tracks.isEmpty {
                    EmptyLibraryView(showingImporter: $showingImporter)
                } else {
                    List {
                        ForEach(filteredTracks) { track in
                            TrackRowView(track: track)
                                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                    Button(role: .destructive) {
                                        deleteTrack(track)
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                                .swipeActions(edge: .leading) {
                                    Button {
                                        toggleFavorite(track)
                                    } label: {
                                        Label("Favorite", systemImage: track.isFavorite ? "heart.slash" : "heart")
                                    }
                                    .tint(track.isFavorite ? .gray : .pink)
                                }
                        }
                    }
                    .listStyle(.plain)
                    .searchable(text: $searchText, prompt: "Search tracks, artists, albums")
                }
            }
            .navigationTitle("Library")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingImporter = true
                    } label: {
                        Label("Import", systemImage: "plus.circle.fill")
                    }
                }
                
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Picker("Sort by", selection: $sortOption) {
                            ForEach(SortOption.allCases, id: \.self) { option in
                                Text(option.rawValue).tag(option)
                            }
                        }
                    } label: {
                        Label("Sort", systemImage: "arrow.up.arrow.down")
                    }
                }
            }
            .fileImporter(
                isPresented: $showingImporter,
                allowedContentTypes: [.audio, .mp3, .mpeg4Audio],
                allowsMultipleSelection: true
            ) { result in
                handleImportResult(result)
            }
        }
    }
    
    private func deleteTrack(_ track: MusicTrack) {
        withAnimation {
            modelContext.delete(track)
        }
    }
    
    private func toggleFavorite(_ track: MusicTrack) {
        withAnimation {
            track.isFavorite.toggle()
        }
    }
    
    private func handleImportResult(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            Task {
                await importAudioFiles(urls)
            }
        case .failure(let error):
            print("Error importing files: \(error.localizedDescription)")
        }
    }
    
    private func importAudioFiles(_ urls: [URL]) async {
        for url in urls {
            guard url.startAccessingSecurityScopedResource() else {
                continue
            }
            defer { url.stopAccessingSecurityScopedResource() }
            
            do {
                // Copy file to app's documents directory
                let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let destinationURL = documentsPath.appendingPathComponent(url.lastPathComponent)
                
                if FileManager.default.fileExists(atPath: destinationURL.path) {
                    try FileManager.default.removeItem(at: destinationURL)
                }
                
                try FileManager.default.copyItem(at: url, to: destinationURL)
                
                // Extract metadata
                let metadata = await AudioMetadataExtractor.extractMetadata(from: destinationURL)
                
                // Create track
                let track = MusicTrack(
                    title: metadata.title ?? url.deletingPathExtension().lastPathComponent,
                    artist: metadata.artist ?? "Unknown Artist",
                    album: metadata.album ?? "Unknown Album",
                    duration: metadata.duration,
                    fileURL: destinationURL,
                    artworkData: metadata.artworkData,
                    genre: metadata.genre ?? "Unknown",
                    year: metadata.year,
                    trackNumber: metadata.trackNumber
                )
                
                await MainActor.run {
                    modelContext.insert(track)
                }
            } catch {
                print("Error importing \(url.lastPathComponent): \(error.localizedDescription)")
            }
        }
    }
}

struct EmptyLibraryView: View {
    @Binding var showingImporter: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "music.note")
                .font(.system(size: 80))
                .foregroundStyle(.secondary)
            
            Text("No Music Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Import your music files to get started")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            Button {
                showingImporter = true
            } label: {
                Label("Import Music", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview("Empty") {
    LibraryView()
        .modelContainer(for: [MusicTrack.self], inMemory: true)
}

#Preview("With Tracks") {
    let container = try! ModelContainer(for: MusicTrack.self, configurations: .init(isStoredInMemoryOnly: true))
    
    return LibraryView()
        .modelContainer(container)
}
