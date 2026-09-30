Pod::Spec.new do |s|
  s.name           = 'FarcasterWebViewStorage'
  s.version        = '1.0.0'
  s.summary        = 'Wipe all WebView-backed storage'
  s.description    = 'Wipe every WebView-backed data store, including cookies, so mini app credentials do not outlive a sign out'
  s.license        = 'MIT'
  s.author         = 'Merkle Manufactory'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
