package expo.modules.appleitorcbr

import android.net.Uri
import be.stef.rar.Unrar5j
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class AppleitorCbrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppleitorCbr")

    AsyncFunction("listPagesAsync") { uri: String ->
      val archiveFile = copyToCache(uri, "inspect")
      val outputDir = File.createTempFile("appleitor-pages-", "", requireNotNull(appContext.reactContext).cacheDir).apply {
        delete()
        mkdirs()
      }
      try {
        val result = Unrar5j.extract(archiveFile.absolutePath, outputDir.absolutePath, null)
        if (result.successCount == 0 && result.errorCount > 0) {
          throw IllegalArgumentException("Não foi possível extrair as páginas do CBR")
        }
        listImageFiles(outputDir)
      } finally {
        archiveFile.delete()
        outputDir.deleteRecursively()
      }
    }

    AsyncFunction("extractPageAsync") { uri: String, entryName: String ->
      val archiveFile = copyToCache(uri, "extract")
      val outputDir = File.createTempFile("appleitor-page-", "", requireNotNull(appContext.reactContext).cacheDir).apply {
        delete()
        mkdirs()
      }
      try {
        val result = Unrar5j.extract(archiveFile.absolutePath, outputDir.absolutePath, null, entryName)
        if (result.successCount == 0) {
          throw IllegalArgumentException("Não foi possível extrair a página do CBR")
        }
        val extracted = findEntry(outputDir, entryName)
          ?: throw IllegalArgumentException("Página não encontrada no CBR: $entryName")
        Uri.fromFile(extracted).toString()
      } finally {
        archiveFile.delete()
        outputDir.deleteRecursively()
      }
    }
  }

  private fun copyToCache(uri: String, prefix: String): File {
    val context = requireNotNull(appContext.reactContext)
    val target = File.createTempFile("appleitor-$prefix-", ".rar", context.cacheDir)
    val input = context.contentResolver.openInputStream(Uri.parse(uri))
      ?: throw IllegalArgumentException("Não foi possível abrir o CBR")
    input.use { source -> target.outputStream().use { destination -> source.copyTo(destination) } }
    return target
  }

  private fun listImageFiles(root: File): List<String> = root.walkTopDown()
    .filter { it.isFile && isImage(it.name) }
    .map { it.relativeTo(root).path.replace(File.separatorChar, '/') }
    .toList()

  private fun findEntry(root: File, entryName: String): File? {
    val normalized = entryName.replace('\\', '/')
    return root.walkTopDown().firstOrNull {
      it.isFile && it.relativeTo(root).path.replace(File.separatorChar, '/') == normalized
    } ?: root.walkTopDown().firstOrNull { it.isFile && it.name == File(normalized).name }
  }

  private fun isImage(name: String) = name.matches(
    Regex(".*\\.(jpe?g|png|webp|gif)$", RegexOption.IGNORE_CASE)
  )
}
