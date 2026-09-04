#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ParkingSearchModule, NSObject)

RCT_EXTERN_METHOD(search:(nonnull NSNumber *)latitude
                  longitude:(nonnull NSNumber *)longitude
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(searchPlaces:(nonnull NSNumber *)latitude
                  longitude:(nonnull NSNumber *)longitude
                  kind:(NSString *)kind
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(searchPlacesQuery:(nonnull NSNumber *)latitude
                  longitude:(nonnull NSNumber *)longitude
                  kind:(NSString *)kind
                  query:(NSString *)query
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end

@interface RCT_EXTERN_MODULE(SiriShortcutsModule, NSObject)

RCT_EXTERN_METHOD(setEnabled:(BOOL)enabled)
RCT_EXTERN_METHOD(updateSnapshot:(NSDictionary *)snapshot)
RCT_EXTERN_METHOD(consumePendingAction:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end

@interface RCT_EXTERN_MODULE(HistoryPhotoThumbnailModule, NSObject)

RCT_EXTERN_METHOD(thumbnail:(NSString *)assetId
                  width:(nonnull NSNumber *)width
                  height:(nonnull NSNumber *)height
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
