package expo.modules.appleitorcbr

import android.net.Uri
import com.github.junrar.Archive
import com.github.junrar.rarfile.FileHeader
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

class AppleitorCbrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppleitorCbr")

    AsyncFunction("listPagesAsync") { uri: String ->
      withArchive(uri) { archive ->
        val pages = mutableListOf<String>()
        var header: FileHeader? = archive.nextFileHeader()
        while (header != null) {
          val current = header
          if (!current.isDirectory && isImage(current.fileNameString)) pages.add(current.fileNameString)
          header = archive.nextFileHeader()
        }
        pages.sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it })
      }
    }

    AsyncFunction("extractPageAsync") { uri: String, entryName: String ->
      val archiveFile = copyToCache(uri, "extract")
      val archive = Archive(archiveFile)
      try {
        var header: FileHeader? = archive.nextFileHeader()
        while (header != null) {
          val current = header
          if (!current.isDirectory && current.fileNameString == entryName) {
            val extension = entryName.substringAfterLast('.', "jpg").lowercase()
            val output = File(requireNotNull(appContext.reactContext).cacheDir, "appleitor-${entryName.hashCode()}.$extension")
            FileOutputStream(output).use { stream -> archive.extractFile(current, stream) }
            return@AsyncFunction Uri.fromFile(output).toString()
          }
          header = archive.nextFileHeader()
        }
        throw IllegalArgumentException("Página não encontrada no CBR: $entryName")
      } finally {
        archive.close()
        archiveFile.delete()
      }
    }
  }

  private fun withArchive(uri: String, block: (Archive) -> List<String>): List<String> {
    val archiveFile = copyToCache(uri, "inspect")
    val archive = Archive(archiveFile)
    return try { block(archive) } finally { archive.close(); archiveFile.delete() }
  }

  private fun copyToCache(uri: String, prefix: String): File {
    val context = requireNotNull(appContext.reactContext)
    val target = File.createTempFile("appleitor-$prefix-", ".rar", context.cacheDir)
    val input = context.contentResolver.openInputStream(Uri.parse(uri)) ?: throw IllegalArgumentException("Não foi possível abrir o CBR")
    input.use { source -> target.outputStream().use { destination -> source.copyTo(destination) } }
    return target
  }

  private fun isImage(name: String) = name.matches(Regex(".*\\.(jpe?g|png|webp|gif)$", RegexOption.IGNORE_CASE))
}
