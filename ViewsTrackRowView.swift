//
//  TrackRowView.swift
//  Design Premium Music Organizer
//
//  Row view for displaying a single track
//

import SwiftUI
import SwiftData

struct TrackRowView: View {
    let track: MusicTrack
    @State private var isPlaying = false
    
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
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 50, height: 50)
                    .overlay {
                        Image(systemName: "music.note")
                            .foregroundStyle(.secondary)
                    }
            }
            
            // Track info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(track.title)
                        .font(.body)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    
                    if track.isFavorite {
                        Image(systemName: "heart.fill")
                            .font(.caption)
                            .foregroundStyle(.pink)
                    }
                }
                
                Text(track.artist)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                
                if !track.album.isEmpty && track.album != "Unknown Album" {
                    Text(track.album)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Duration
            Text(track.durationFormatted)
                .font(.caption)
                .foregroundStyle(.secondary)
                .monospacedDigit()
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}

#Preview {
    let track = MusicTrack(
        title: "Sample Song",
        artist: "Sample Artist",
        album: "Sample Album",
        duration: 195,
        fileURL: URL(fileURLWithPath: "/path/to/file.mp3"),
        isFavorite: true
    )
    
    return TrackRowView(track: track)
        .padding()
}
