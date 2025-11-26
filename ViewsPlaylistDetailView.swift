//
//  PlaylistDetailView.swift
//  Design Premium Music Organizer
//
//  Detail view for a single playlist
//

import SwiftUI
import SwiftData

struct PlaylistDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Bindable var playlist: Playlist
    @Query private var allTracks: [MusicTrack]
    @State private var showingAddTracks = false
    
    var body: some View {
        List {
            if playlist.tracks.isEmpty {
                Section {
                    VStack(spacing: 12) {
                        Image(systemName: "music.note.list")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        
                        Text("No tracks in this playlist")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        
                        Button {
                            showingAddTracks = true
                        } label: {
                            Label("Add Tracks", systemImage: "plus")
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                }
                .listRowBackground(Color.clear)
            } else {
                ForEach(playlist.tracks) { track in
                    TrackRowView(track: track)
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                removeTrack(track)
                            } label: {
                                Label("Remove", systemImage: "minus.circle")
                            }
                        }
                }
                .onMove { indices, newOffset in
                    playlist.tracks.move(fromOffsets: indices, toOffset: newOffset)
                }
            }
        }
        .navigationTitle(playlist.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        showingAddTracks = true
                    } label: {
                        Label("Add Tracks", systemImage: "plus")
                    }
                    
                    Button(role: .destructive) {
                        // Clear playlist
                    } label: {
                        Label("Clear Playlist", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
            
            if !playlist.tracks.isEmpty {
                ToolbarItem(placement: .topBarLeading) {
                    EditButton()
                }
            }
        }
        .sheet(isPresented: $showingAddTracks) {
            AddTracksToPlaylistView(playlist: playlist, isPresented: $showingAddTracks)
        }
    }
    
    private func removeTrack(_ track: MusicTrack) {
        withAnimation {
            if let index = playlist.tracks.firstIndex(where: { $0.id == track.id }) {
                playlist.tracks.remove(at: index)
            }
        }
    }
}

struct AddTracksToPlaylistView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var playlist: Playlist
    @Binding var isPresented: Bool
    @Query private var allTracks: [MusicTrack]
    @State private var selectedTracks: Set<UUID> = []
    @State private var searchText = ""
    
    var filteredTracks: [MusicTrack] {
        let playlistTrackIDs = Set(playlist.tracks.map { $0.id })
        let availableTracks = allTracks.filter { !playlistTrackIDs.contains($0.id) }
        
        if searchText.isEmpty {
            return availableTracks
        } else {
            return availableTracks.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.artist.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var body: some View {
        NavigationStack {
            Group {
                if filteredTracks.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "music.note.list")
                            .font(.system(size: 60))
                            .foregroundStyle(.secondary)
                        
                        Text(searchText.isEmpty ? "No more tracks available" : "No matching tracks")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    List(filteredTracks) { track in
                        Button {
                            toggleSelection(track)
                        } label: {
                            HStack {
                                TrackRowView(track: track)
                                
                                Spacer()
                                
                                if selectedTracks.contains(track.id) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.blue)
                                } else {
                                    Image(systemName: "circle")
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .navigationTitle("Add Tracks")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Search tracks")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add (\(selectedTracks.count))") {
                        addSelectedTracks()
                    }
                    .disabled(selectedTracks.isEmpty)
                }
            }
        }
    }
    
    private func toggleSelection(_ track: MusicTrack) {
        if selectedTracks.contains(track.id) {
            selectedTracks.remove(track.id)
        } else {
            selectedTracks.insert(track.id)
        }
    }
    
    private func addSelectedTracks() {
        let tracksToAdd = allTracks.filter { selectedTracks.contains($0.id) }
        playlist.tracks.append(contentsOf: tracksToAdd)
        dismiss()
    }
}

#Preview {
    let container = try! ModelContainer(for: Playlist.self, MusicTrack.self, configurations: .init(isStoredInMemoryOnly: true))
    let playlist = Playlist(name: "My Playlist")
    
    return PlaylistDetailView(playlist: playlist)
        .modelContainer(container)
}
