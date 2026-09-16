Pod::Spec.new do |s|
  s.name           = 'RNICloud'
  s.version        = '0.0.1'
  s.summary        = 'React Native bridge module for iOS iCloud'
  s.description    = 'React Native bridge module for iOS iCloud'
  s.author         = ''
  s.homepage       = 'https://farcaster.xyz'
  s.platform       = :ios, '15.1'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
