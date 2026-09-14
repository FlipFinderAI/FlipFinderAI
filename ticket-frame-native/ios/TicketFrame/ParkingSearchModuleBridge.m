#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>

@interface RCT_EXTERN_MODULE(ParkingSearchModule, NSObject)

RCT_EXTERN_METHOD(search:(nonnull NSNumber *)latitude
                  longitude:(nonnull NSNumber *)longitude
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(pickPlace:(nonnull NSNumber *)latitude
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

@interface RCT_EXTERN_MODULE(HistoryStadiumMapViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(stadiums, NSArray)
RCT_EXPORT_VIEW_PROPERTY(mapType, NSString)
RCT_EXPORT_VIEW_PROPERTY(onSelect, RCTBubblingEventBlock)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
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

@interface RCT_EXTERN_MODULE(PdfTicketRendererModule, NSObject)

RCT_EXTERN_METHOD(renderFirstPage:(NSString *)sourceUri
                  maxDimension:(nonnull NSNumber *)maxDimension
                  resolver:(RCTPromiseResolveBlock)resolve
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

@interface RCT_EXTERN_MODULE(WalletPassModule, NSObject)

RCT_EXTERN_METHOD(listPendingPasses:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(readPendingPass:(NSString *)fileName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removePendingPass:(NSString *)fileName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(listPendingScreenshots:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(readPendingScreenshot:(NSString *)fileName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removePendingScreenshot:(NSString *)fileName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(queueScreenshotsSince:(nonnull NSNumber *)sinceMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}


RCT_EXTERN_METHOD(detectWalletTicketBounds:(NSString *)uri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
