//
//  MusicImportService.swift
//  ReplayMusic
//
//  Created on 11/25/2025.
//

import Foundation
import AVFoundation
import UIKit
import SwiftData

@MainActor
class MusicImportService: ObservableObject {
    @Published var isImporting = false
    @Published var importProgress: Double = 0
    @Published var errorMessage: String?
    
    private let modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    /// Import a single music file
    func importMusicFile(from url: URL) async throws -> MusicTrack {
        isImporting = true
        defer { isImporting = false }
        
        // Access security-scoped resource
        guard url.startAccessingSecurityScopedResource() else {
            throw ImportError.accessDenied
        }
        defer { url.stopAccessingSecurityScopedResource() }
        
        // Copy file to app's documents directory
        let destinationURL = try copyToDocumentsDirectory(from: url)
        
        // Extract metadata
        let metadata = try await extractMetadata(from: destinationURL)
        
        // Create MusicTrack
        let track = MusicTrack(
            title: metadata.title ?? url.deletingPathExtension().lastPathComponent,
            artist: metadata.artist ?? "Unknown Artist",
            album: metadata.album ?? "",
            duration: metadata.duration,
            fileURL: destinationURL,
            artworkData: metadata.artworkData,
            genre: metadata.genre,
            year: metadata.year
        )
        
        // Save to SwiftData
        modelContext.insert(track)
        try modelContext.save()
        
        return track
    }
    
    /// Import multiple music files
    func importMusicFiles(from urls: [URL]) async throws -> [MusicTrack] {
        isImporting = true
        defer { isImporting = false }
        
        var importedTracks: [MusicTrack] = []
        let total = Double(urls.count)
        
        for (index, url) in urls.enumerated() {
            do {
                let track = try await importMusicFile(from: url)
                importedTracks.append(track)
                importProgress = Double(index + 1) / total
            } catch {
                print("Failed to import \(url.lastPathComponent): \(error)")
                errorMessage = "Failed to import some files"
            }
        }
        
        importProgress = 0
        return importedTracks
    }
    
    // MARK: - Private Methods
    
    private func copyToDocumentsDirectory(from sourceURL: URL) throws -> URL {
        let fileManager = FileManager.default
        let documentsDirectory = try fileManager.url(
            for: .documentDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        
        let musicDirectory = documentsDirectory.appendingPathComponent("Music", isDirectory: true)
        
        // Create Music directory if it doesn't exist
        if !fileManager.fileExists(atPath: musicDirectory.path) {
            try fileManager.createDirectory(at: musicDirectory, withIntermediateDirectories: true)
        }
        
        let destinationURL = musicDirectory.appendingPathComponent(sourceURL.lastPathComponent)
        
        // Remove existing file if present
        if fileManager.fileExists(atPath: destinationURL.path) {
            try fileManager.removeItem(at: destinationURL)
        }
        
        try fileManager.copyItem(at: sourceURL, to: destinationURL)
        
        return destinationURL
    }
    
    private func extractMetadata(from url: URL) async throws -> TrackMetadata {
        let asset = AVAsset(url: url)
        
        // Get duration
        let duration = try await asset.load(.duration).seconds
        
        // Extract metadata
        let metadata = try await asset.load(.metadata)
        
        var title: String?
        var artist: String?
        var album: String?
        var genre: String?
        var year: Int?
        var artworkData: Data?
        
        for item in metadata {
            guard let key = item.commonKey?.rawValue,
                  let value = try? await item.load(.value) else {
                continue
            }
            
            switch key {
            case AVMetadataKey.commonKeyTitle.rawValue:
                title = value as? String
            case AVMetadataKey.commonKeyArtist.rawValue:
                artist = value as? String
            case AVMetadataKey.commonKeyAlbumName.rawValue:
                album = value as? String
            case AVMetadataKey.commonKeyType.rawValue:
                genre = value as? String
            case AVMetadataKey.commonKeyCreationDate.rawValue:
                if let dateString = value as? String {
                    year = Int(dateString.prefix(4))
                }
            case AVMetadataKey.commonKeyArtwork.rawValue:
                if let data = value as? Data {
                    artworkData = data
                }
            default:
                break
            }
        }
        
        return TrackMetadata(
            title: title,
            artist: artist,
            album: album,
            duration: duration,
            genre: genre,
            year: year,
            artworkData: artworkData
        )
    }
}

// MARK: - Supporting Types

struct TrackMetadata {
    let title: String?
    let artist: String?
    let album: String?
    let duration: TimeInterval
    let genre: String?
    let year: Int?
    let artworkData: Data?
}

enum ImportError: LocalizedError {
    case accessDenied
    case invalidFileFormat
    case copyFailed
    case metadataExtractionFailed
    
    var errorDescription: String? {
        switch self {
        case .accessDenied:
            return "Access to the file was denied"
        case .invalidFileFormat:
            return "The file format is not supported"
        case .copyFailed:
            return "Failed to copy file to app directory"
        case .metadataExtractionFailed:
            return "Failed to extract file metadata"
        }
    }
}
