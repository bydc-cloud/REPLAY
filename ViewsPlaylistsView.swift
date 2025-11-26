//
//  PlaylistsView.swift
//  Design Premium Music Organizer
//
//  View for managing playlists
//

import SwiftUI
import SwiftData

struct PlaylistsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Playlist.createdDate, order: .reverse) private var playlists: [Playlist]
    @State private var showingCreatePlaylist = false
    @State private var newPlaylistName = ""
    
    var body: some View {
        NavigationStack {
            Group {
                if playlists.isEmpty {
                    EmptyPlaylistsView(showingCreatePlaylist: $showingCreatePlaylist)
                } else {
                    List {
                        ForEach(playlists) { playlist in
                            NavigationLink(destination: PlaylistDetailView(playlist: playlist)) {
                                PlaylistRowView(playlist: playlist)
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    deletePlaylist(playlist)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Playlists")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingCreatePlaylist = true
                    } label: {
                        Label("Create Playlist", systemImage: "plus.circle.fill")
                    }
                }
            }
            .sheet(isPresented: $showingCreatePlaylist) {
                CreatePlaylistSheet(isPresented: $showingCreatePlaylist)
            }
        }
    }
    
    private func deletePlaylist(_ playlist: Playlist) {
        withAnimation {
            modelContext.delete(playlist)
        }
    }
}

struct PlaylistRowView: View {
    let playlist: Playlist
    
    var body: some View {
        HStack(spacing: 12) {
            // Artwork
            if let artworkData = playlist.artworkData,
               let uiImage = UIImage(data: artworkData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 60, height: 60)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(LinearGradient(
                        colors: [.blue, .purple],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 60, height: 60)
                    .overlay {
                        Image(systemName: "music.note.list")
                            .font(.title2)
                            .foregroundStyle(.white)
                    }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(playlist.name)
                    .font(.headline)
                    .lineLimit(1)
                
                Text("\(playlist.trackCount) \(playlist.trackCount == 1 ? "track" : "tracks")")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

struct EmptyPlaylistsView: View {
    @Binding var showingCreatePlaylist: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "music.note.list")
                .font(.system(size: 80))
                .foregroundStyle(.secondary)
            
            Text("No Playlists Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Create playlists to organize your music")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            Button {
                showingCreatePlaylist = true
            } label: {
                Label("Create Playlist", systemImage: "plus.circle.fill")
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

struct CreatePlaylistSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Binding var isPresented: Bool
    @State private var playlistName = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Playlist Name", text: $playlistName)
                        .textInputAutocapitalization(.words)
                } header: {
                    Text("Name")
                }
            }
            .navigationTitle("New Playlist")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createPlaylist()
                    }
                    .disabled(playlistName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
    
    private func createPlaylist() {
        let playlist = Playlist(name: playlistName.trimmingCharacters(in: .whitespaces))
        modelContext.insert(playlist)
        dismiss()
    }
}

#Preview {
    PlaylistsView()
        .modelContainer(for: [Playlist.self], inMemory: true)
}
