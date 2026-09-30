package farcaster.modules.appLinking

import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppLinkingModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FarcasterAppLinking")

    AsyncFunction("openInstalledAppForUrl") { url: String ->
      openInstalledAppForUrl(url)
    }
  }

  private fun openInstalledAppForUrl(url: String): Boolean {
    val context = appContext.reactContext ?: return false
    val uri = Uri.parse(url)
    val scheme = uri.scheme?.lowercase()

    if (scheme != "https" && scheme != "http") {
      return false
    }

    val packageManager = context.packageManager
    val exactIntent = Intent(Intent.ACTION_VIEW, uri)
      .addCategory(Intent.CATEGORY_BROWSABLE)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    val genericBrowserPackages = queryGenericBrowserPackages(packageManager, scheme)
    val appHandlers = queryViewHandlers(packageManager, exactIntent)
      .filter { resolveInfo ->
        val packageName = resolveInfo.activityInfo?.packageName
        packageName != null && !genericBrowserPackages.contains(packageName)
      }
      .distinctBy { resolveInfo ->
        "${resolveInfo.activityInfo.packageName}/${resolveInfo.activityInfo.name}"
      }

    if (appHandlers.isEmpty()) {
      return false
    }

    val preferredHandler = resolveViewHandler(packageManager, exactIntent)
    val targetHandlers = if (
      preferredHandler?.activityInfo?.packageName != null &&
      !genericBrowserPackages.contains(preferredHandler.activityInfo.packageName)
    ) {
      listOf(preferredHandler)
    } else {
      appHandlers
    }

    val intents = targetHandlers.map { handler ->
      Intent(exactIntent).setClassName(
        handler.activityInfo.packageName,
        handler.activityInfo.name,
      )
    }

    val launchIntent = if (intents.size == 1) {
      intents.first()
    } else {
      Intent.createChooser(intents.first(), "Open with").apply {
        putExtra(Intent.EXTRA_INITIAL_INTENTS, intents.drop(1).toTypedArray())
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    }

    return try {
      context.startActivity(launchIntent)
      true
    } catch (_: Exception) {
      false
    }
  }

  private fun queryGenericBrowserPackages(
    packageManager: PackageManager,
    scheme: String,
  ): Set<String> {
    val genericIntent = Intent(Intent.ACTION_VIEW, Uri.parse("$scheme://example.com"))
      .addCategory(Intent.CATEGORY_BROWSABLE)

    return queryViewHandlers(packageManager, genericIntent)
      .mapNotNull { resolveInfo -> resolveInfo.activityInfo?.packageName }
      .toSet()
  }

  private fun queryViewHandlers(
    packageManager: PackageManager,
    intent: Intent,
  ): List<ResolveInfo> {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.queryIntentActivities(
        intent,
        PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong()),
      )
    } else {
      @Suppress("DEPRECATION")
      packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
    }
  }

  private fun resolveViewHandler(
    packageManager: PackageManager,
    intent: Intent,
  ): ResolveInfo? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.resolveActivity(
        intent,
        PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong()),
      )
    } else {
      @Suppress("DEPRECATION")
      packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
    }
  }
}
