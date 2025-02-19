import { Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavParams, LoadingController } from 'ionic-angular';
import { Camera } from 'ionic-native';

import { Client } from '../../common/services/api/client';
import { Upload } from '../../common/services/api/upload';
import { CacheService } from '../../common/services/cache/cache.service';
import { Storage } from '../../common/services/storage';

@Component({
  moduleId: 'module.id',
  selector: 'channel',
  templateUrl: 'channel.component.html',
  //styleUrls: [ 'channel.component.css' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChannelComponent {


  guid : string = "me";
  channel : any = {};

  editing = {
    name: false,
    avatar: false
  };

  constructor(private client : Client, private upload : Upload, private params: NavParams, private cache : CacheService,
    private cd: ChangeDetectorRef, private loadingCtrl : LoadingController, private storage : Storage){
    //if(applicationModule.android)
    //  page.actionBarHidden = true;
  }

  ngOnInit(){
    this.guid = this.params.get('guid');
    if(this.params.get('channel')){
      this.channel = this.params.get('channel');
      if(this.channel){
        this.guid = this.channel.guid;
        //return;
      }
    }

    this.load();
  }

  @Input() set username(value : string){
    this.channel = null;
    this.guid = value;
    this.load();
  }

  //ngAfterViewInit() {
    //this.loadFeed();
  //}

  load(){
    let _channel = this.cache.get('channel:' + this.guid);
    if(_channel && !this.channel){
      this.channel = _channel;
      this.cd.markForCheck();
      this.cd.detectChanges();
      //return true;
    }

    this.client.get('api/v1/channel/' + this.guid)
      .then((response : any) => {
        this.channel = response.channel;
        this.cache.set('channel:' + this.guid, this.channel, true);
        this.cd.markForCheck();
        this.cd.detectChanges();
      });
  }

  save(data : any){
    this.client.post('api/v1/channel/' + this.guid, data)
      .then(() => {});
  }

  changeAvatar(){
    //can change?
    if(this.channel.guid != this.storage.get('user_guid'))
      return;

    Camera.getPicture({
        correctOrientation: true,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: 0,
        mediaType: 2
      })
      .then((data) => {
        let loader = this.loadingCtrl.create({
          content: "Please wait...",
        });
        loader.present();

        this.upload.post('api/v1/channel/avatar', [ data ])
          .then((response : any) => {
            loader.dismiss();
            this.channel.icontime = Date.now();
            this.cd.markForCheck();
            this.cd.detectChanges();
          })
          .catch((exception)=>{
            loader.dismiss();
          });
      }, (err) => { });

  }

  subscribe(){
    if(this.channel.subscribed){
      return this.unsubscribe();
    }
    this.channel.subscribed = true;
    this.cd.markForCheck();
    this.cd.detectChanges();
    this.client.post('api/v1/subscribe/' + this.channel.guid, {})
      .then((response : any) => {
          this.channel.subscribed = true;
      })
      .catch((e) => {
        this.channel.subscribed = false;
        this.cd.markForCheck();
        this.cd.detectChanges();
      });
  }

  unsubscribe(){
    this.channel.subscribed = false;
    this.cd.markForCheck();
    this.cd.detectChanges();
    this.client.delete('api/v1/subscribe/' + this.channel.guid, {})
      .then((response : any) => {
          this.channel.subscribed = false;
      })
      .catch((e) => {
        this.channel.subscribed = true;
        this.cd.markForCheck();
        this.cd.detectChanges();
      });
  }

  refresh(){

  }

}
