//
//  LibraryView.swift
//  ReplayMusic
//
//  Created on 11/25/2025.
//

import SwiftUI
import SwiftData

struct LibraryView: View {
    let tracks: [MusicTrack]
    let playerService: MusicPlayerService
    
    @State private var searchText = ""
    @State private var sortOption: SortOption = .dateAdded
    
    enum SortOption: String, CaseIterable {
        case dateAdded = "Date Added"
        case title = "Title"
        case artist = "Artist"
        case album = "Album"
    }
    
    var filteredAndSortedTracks: [MusicTrack] {
        let filtered = searchText.isEmpty ? tracks : tracks.filter { track in
            track.title.localizedCaseInsensitiveContains(searchText) ||
            track.artist.localizedCaseInsensitiveContains(searchText) ||
            track.album.localizedCaseInsensitiveContains(searchText)
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
        VStack(spacing: 0) {
            if tracks.isEmpty {
                emptyStateView
            } else {
                List {
                    ForEach(filteredAndSortedTracks) { track in
                        TrackRow(track: track, playerService: playerService)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    deleteTrack(track)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                    }
                }
                .searchable(text: $searchText, prompt: "Search your library")
                .navigationTitle("Library")
                .toolbar {
                    ToolbarItem(placement: .secondaryAction) {
                        Menu {
                            Picker("Sort By", selection: $sortOption) {
                                ForEach(SortOption.allCases, id: \.self) { option in
                                    Text(option.rawValue).tag(option)
                                }
                            }
                        } label: {
                            Label("Sort", systemImage: "arrow.up.arrow.down")
                        }
                    }
                }
            }
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "music.note")
                .font(.system(size: 80))
                .foregroundStyle(.secondary)
            
            Text("No Music Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Tap the + button to import your music")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func deleteTrack(_ track: MusicTrack) {
        // Delete from SwiftData
        guard let modelContext = track.modelContext else { return }
        
        // Delete the file
        try? FileManager.default.removeItem(at: track.fileURL)
        
        // Delete from database
        modelContext.delete(track)
        try? modelContext.save()
    }
}

struct TrackRow: View {
    let track: MusicTrack
    let playerService: MusicPlayerService
    
    @Environment(\.modelContext) private var modelContext
    
    var isCurrentTrack: Bool {
        playerService.currentTrack?.id == track.id
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Artwork
            if let artworkData = track.artworkData,
               let uiImage = UIImage(data: artworkData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 50, height: 50)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(.quaternary)
                    .frame(width: 50, height: 50)
                    .overlay {
                        Image(systemName: "music.note")
                            .foregroundStyle(.secondary)
                    }
            }
            
            // Track Info
            VStack(alignment: .leading, spacing: 4) {
                Text(track.title)
                    .font(.body)
                    .fontWeight(isCurrentTrack ? .semibold : .regular)
                    .foregroundStyle(isCurrentTrack ? .blue : .primary)
                    .lineLimit(1)
                
                Text(track.artist)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            
            Spacer()
            
            // Duration
            Text(formatDuration(track.duration))
                .font(.caption)
                .foregroundStyle(.secondary)
            
            // Play indicator
            if isCurrentTrack && playerService.isPlaying {
                Image(systemName: "waveform")
                    .font(.caption)
                    .foregroundStyle(.blue)
                    .symbolEffect(.variableColor.iterative.reversing)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            playerService.play(track: track, queue: [track])
        }
        .contextMenu {
            Button {
                track.isFavorite.toggle()
                try? modelContext.save()
            } label: {
                Label(
                    track.isFavorite ? "Remove from Favorites" : "Add to Favorites",
                    systemImage: track.isFavorite ? "heart.slash" : "heart"
                )
            }
            
            Divider()
            
            Button(role: .destructive) {
                deleteTrack()
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
    
    private func deleteTrack() {
        try? FileManager.default.removeItem(at: track.fileURL)
        modelContext.delete(track)
        try? modelContext.save()
    }
}

#Preview {
    NavigationStack {
        LibraryView(tracks: [], playerService: MusicPlayerService())
    }
    .modelContainer(for: [MusicTrack.self], inMemory: true)
}
