package com.farcaster.mobile

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsProvider
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlagsDefaults
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.farcaster.mobile.spaces.SpaceForegroundPackage
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

class MainApplication : Application(), ReactApplication {

  private fun getAppPackages(): List<ReactPackage> =
      PackageList(this).packages.apply {
        add(SpaceForegroundPackage())
      }

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
          return getAppPackages()
        }

        override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList = getAppPackages(),
      jsMainModulePath = ".expo/.virtual-metro-entry",
      useDevSupport = BuildConfig.DEBUG
    )

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // Load the New Architecture entry point with one extra Fabric flag on
      // top of the standard stable set:
      //  - enablePreparedTextLayout: build text StaticLayouts once at measure
      //    time (background layout thread) and reuse them at mount, instead of
      //    re-constructing them inside the main-thread mount batch.
      // Do NOT add enablePropsUpdateReconciliationAndroid here: RN 0.83.6
      // ships the pre-fix BaseTextProps diff code, which crashes when a Text
      // prop (fontWeight, textAlign, textDecorationLine, ...) transitions
      // from set to unset (fixed upstream in facebook/react-native#55265).
      // Revisit on the RN upgrade that includes the fix (NEYN-11908).
      // load() installs the RNOSS-Stable overrides itself and feature flags
      // can only be overridden once per process, so the flags must go through
      // loadWithFeatureFlags. That entry point is internal to the ReactAndroid
      // Kotlin module but public at the JVM level, hence the reflective call
      // (kept by the proguard rule next to the other RN keeps).
      val flags = object : ReactNativeNewArchitectureFeatureFlagsDefaults() {
        // Replicates ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android,
        // which is final and cannot be extended directly.
        override fun useFabricInterop(): Boolean = true
        override fun useShadowNodeStateOnClone(): Boolean = true
        override fun enablePreparedTextLayout(): Boolean = true
      }
      val entryPointClass = DefaultNewArchitectureEntryPoint::class.java
      val loadWithFeatureFlagsMethod =
        listOf(
          "loadWithFeatureFlags${'$'}ReactAndroid_release",
          "loadWithFeatureFlags${'$'}ReactAndroid_debug",
        )
          .firstNotNullOfOrNull { methodName ->
            runCatching {
              entryPointClass.getDeclaredMethod(
                methodName,
                ReactNativeFeatureFlagsProvider::class.java,
              )
            }.getOrNull()
          }
          ?: throw NoSuchMethodException(
            "DefaultNewArchitectureEntryPoint.loadWithFeatureFlags",
          )
      loadWithFeatureFlagsMethod.invoke(null, flags)
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
