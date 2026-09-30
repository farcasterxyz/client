Pod::Spec.new do |s|
  s.name           = 'FarcasterAppLinking'
  s.version        = '1.0.0'
  s.summary        = 'Open installed apps for web links'
  s.description    = 'Open installed apps for web links without falling back to the system browser'
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
