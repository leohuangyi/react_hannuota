var Tower = new React.createClass({
    getInitialState: function(){
        return {
          disks: this.props.disks
        };
    },
    renderDisks: function(){
        var disks = this.state.disks;   //该塔拥有的盘
        if(disks.length < 1) return '';
        var towerWidth = this.props.tWidth; //塔的宽度
        var towerHeight = this.props.tHeight; //塔的高度
        var disksTotal = this.props.dTotal; //需要搬动的盘的总数

        var dHeight = Math.floor((towerHeight * 0.618 / disksTotal)); //盘子的高度公差
        if(dHeight > towerHeight * 0.0618){
            dHeight = towerHeight * 0.0618;
        }

        var tDiskWidth = 0.3 *  towerWidth;  //最顶上盘子的宽度
        var bDiskWidth = 0.95 * towerWidth; //最底部盘子的宽度
        var dWidth = (bDiskWidth - tDiskWidth) / (disksTotal - 1); //盘子宽度公差

        var diskHtml = [];
        var bottom = 0;
        var disksLength = disks.length;
        var _this = this;
        disks.forEach(function(disk, index){
            var diskWidth = tDiskWidth + dWidth * (disk - 1);
            var diskStyle = {

                height: dHeight,
                width: diskWidth,
                left: towerWidth / 2 - diskWidth / 2,
                bottom: bottom
            };
            bottom += dHeight;

            var ref = '';
            if(index === disksLength - 1) {
                ref = 'top'
            }
            diskHtml.push(
                <div ref={ref} data-towerid={_this.props.towerId}  className="disk" style={diskStyle}>
                    <div className="disk-num">{disk}</div>
                </div>
            );

        });
        return diskHtml;
    },
    render: function(){
        var disks = this.state.disks;
        var topDisk = 0;

        if(disks.length > 0){
            var topDisk = disks[disks.length-1];
        }

        var towerBgStyle = {
            width: 80,
            left: this.props.tWidth / 2 - 80 / 2
        };
        return (
            <div className="tower-box">
                <div ref="dropTarget" data-towerid={this.props.towerId} className="tower-bg" style={towerBgStyle}>
                    <div className="tower-pillar"></div>
                </div>
                <div className="disk-box">
                    {this.renderDisks()}
                </div>
            </div>
        );
    },
    //为'塔顶的盘'赋可拖动能力，'塔'赋可放能力
    bindDragDrop: function(){
        //先将所有盘子的可拖动能力剥除
        $(this.getDOMNode()).find( ".disk.ui-draggable" ).draggable( "disable" );
        var _this = this;
        //赋予可拖能力
        if(this.refs.top){
            var topDiskDom = $(this.refs.top.getDOMNode());
            topDiskDom.draggable({
                revert: true,
                start: function(){
                    _this.props.setDragTower(_this.props.towerId);
                }
            }).draggable('enable');
        }

        //赋予可放能力
        var dropTargetDom = $(this.refs.dropTarget.getDOMNode());
        dropTargetDom.droppable({
            drop: function( event, ui ) {
                var toTowerId = $(event.target).data('towerid');
                _this.props.handleDrop(toTowerId);
            },
            over: function(event, ui){
                $(this).find('.tower-pillar').addClass('dragOver');
            },
            out: function(){
                $(this).find('.tower-pillar').removeClass('dragOver');
            }
        });
    },
    componentDidMount: function(){
        this.bindDragDrop();
    },
    componentDidUpdate: function(){
        this.bindDragDrop();
    }
});

var TowerBox = new React.createClass({
    getInitialState: function(){
        return {
            time: 0
        }
    },
    setDragTower: function(){
        //拖动开始时，设置可拖动的盘
        return function(dragTowerId){
            this.setState({
                dragTower:  this.refs['tower'+dragTowerId]
            });
        }.bind(this);
    },
    checkIfDone: function(){
        //检查是否完成汉诺塔移动
        var tower3Disks = this.refs.tower3.state.disks;
        if(tower3Disks && tower3Disks.length == this.props.dTotal){
            clearInterval(this.state.timeInterval);
            $('#result-modal').modal({
                closable: false,
                onApprove: function(){
                    endGame();
                    startGame();
                }
            }).modal('show');

            var minMove = Math.pow(2, this.props.dTotal) - 1; //最少搬运次数
            var minTime = minMove * 2; //最佳时间
            /*
                d倍的minTime 时间分数为0
                1倍的minTime 时间分数为dT * minTime
                由此推出依次方程y = kx + b 的k与b
             */
            var d = 4; //衰减系数,耗费超过d倍的最佳时间，则该时间得分为0
            var dT = 100; //时间价值
            var k = dT / (1-d);
            var b = -1 * k * d * minTime;

            var time = this.state.time / 1000;
            var baseScore = minMove * 10;
            var timeScore = 0;

            if(time > minTime * d){
                timeScore = 0;
            }else{
                timeScore = k * time + b;
            }
            var score = baseScore + timeScore;

            $('#uName-res').text(this.props.uName);
            $('#num-res').text(this.props.dTotal);
            $('#time-res').text((this.state.time/1000).toFixed(1));
            $('#score-res').text(score.toFixed(0));
        }
    },
    handleDrop: function(){
        //处理拖动结束
        return function(toTowerId){
            var toTowerReact = this.refs['tower'+toTowerId];
            var toDisks = toTowerReact.state.disks;
            var toNum = 0;  //要放到的塔的顶部盘的序号
            if(toDisks.length > 0){
                toNum = toDisks[toDisks.length-1];
            }else{
                toDisks = [];
            }

            var fromTowerReact = this.state.dragTower;
            var fromDisks = fromTowerReact.state.disks;
            var fromNum = fromDisks[fromDisks.length -1]; //要放的盘的序号

            if(toNum === 0 || fromNum < toNum){
                //成功拖动
                fromDisks.pop();
                fromTowerReact.setState({
                    disks: fromDisks
                });

                toDisks.push(fromNum);
                toTowerReact.setState({
                    disks: toDisks
                });
                this.checkIfDone();
            }else{
                //失败拖动
            }
            $('.tower-bg').find('.tower-pillar').removeClass('dragOver');
        }.bind(this);
    },
    renderTowers: function(){
        var towerWidth = $(window).width() / 3;
        var towerHeight = $(window).height() * 0.75;
        var diskTotal = this.props.dTotal;

        var disks = [];
        for(var i = diskTotal; i > 0; i--){
            disks.push(i);
        }

        var disksEmpty= [];
        var towers = [
            <Tower ref="tower1" towerId="1" handleDrop={this.handleDrop()} setDragTower={this.setDragTower()} tWidth={towerWidth} disks={disks} tHeight={towerHeight} dTotal={diskTotal} />,
            <Tower ref="tower2" towerId="2" handleDrop={this.handleDrop()} setDragTower={this.setDragTower()} tWidth={towerWidth} disks={[]} tHeight={towerHeight} dTotal={diskTotal} />,
            <Tower ref="tower3" towerId="3" handleDrop={this.handleDrop()} setDragTower={this.setDragTower()} tWidth={towerWidth} disks={[]} tHeight={towerHeight} dTotal={diskTotal} />
        ];
        return towers;
    },
    render: function(){
        return (
            <div className="box">
                <div className="time-box">
                    <button className="ui inverted blue button tiny">
                        {(this.state.time/1000).toFixed(1)}秒
                    </button>
                </div>
                { this.renderTowers() }
            </div>
        );
    },
    componentDidMount: function(){
        var _this = this;
        var timeInterval = setInterval(function(){
            var time = _this.state.time;
            time += 100;
            _this.setState({
                time : time
            });
        },100);
        this.setState({
            timeInterval: timeInterval
        });
    },
    componentWillUnmount: function(){
        //销毁定时器
        window.clearInterval(this.state.timeInterval);
    }

});
