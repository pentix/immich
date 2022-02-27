import 'package:auto_route/auto_route.dart';
import 'package:badges/badges.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';

import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/backup_state.model.dart';
import 'package:immich_mobile/shared/providers/backup.provider.dart';

class ImmichSliverAppBar extends ConsumerWidget {
  const ImmichSliverAppBar({
    Key? key,
    this.onPopBack,
  }) : super(key: key);

  final Function? onPopBack;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final BackUpState _backupState = ref.watch(backupProvider);
    bool _isEnableAutoBackup = ref.watch(authenticationProvider).deviceInfo.isAutoBackup;
    return SliverAppBar(
      centerTitle: true,
      floating: true,
      pinned: false,
      snap: false,
      backgroundColor: Colors.grey[200],
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(5))),
      leading: Builder(
        builder: (BuildContext context) {
          return IconButton(
            icon: const Icon(Icons.account_circle_rounded),
            onPressed: () {
              Scaffold.of(context).openDrawer();
            },
            tooltip: MaterialLocalizations.of(context).openAppDrawerTooltip,
          );
        },
      ),
      title: Text(
        'IMMICH',
        style: GoogleFonts.snowburstOne(
          textStyle: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 22,
            color: Theme.of(context).primaryColor,
          ),
        ),
      ),
      actions: [
        Stack(
          alignment: AlignmentDirectional.center,
          children: [
            _backupState.backupProgress == BackUpProgressEnum.inProgress
                ? Positioned(
                    top: 10,
                    right: 12,
                    child: SizedBox(
                      height: 8,
                      width: 8,
                      child: CircularProgressIndicator(
                        strokeWidth: 1,
                        valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).primaryColor),
                      ),
                    ),
                  )
                : Container(),
            IconButton(
              splashRadius: 25,
              iconSize: 30,
              icon: _isEnableAutoBackup
                  ? const Icon(Icons.backup_rounded)
                  : Badge(
                      padding: const EdgeInsets.all(4),
                      elevation: 1,
                      position: BadgePosition.bottomEnd(bottom: -4, end: -4),
                      badgeColor: Colors.white,
                      badgeContent: const Icon(
                        Icons.cloud_off_rounded,
                        size: 8,
                      ),
                      child: const Icon(Icons.backup_rounded)),
              tooltip: 'Backup Controller',
              onPressed: () async {
                var onPop = await AutoRouter.of(context).push(const BackupControllerRoute());

                if (onPop == true) {
                  onPopBack!();
                }
              },
            ),
            _backupState.backupProgress == BackUpProgressEnum.inProgress
                ? Positioned(
                    bottom: 5,
                    child: Text(
                      _backupState.backingUpAssetCount.toString(),
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  )
                : Container()
          ],
        ),
      ],
    );
  }
}
