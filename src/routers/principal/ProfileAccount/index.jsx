import React, { PropTypes } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Table, Tag, Popconfirm, Button, Modal } from 'antd';
import StatusPoint from 'components/StatusPoint';
import AccountForm from 'components/form/AccountForm';
import { AccountStatus, OJ_MAP } from 'models/account';

const getColumns = (filters, operations) => (
  [{
    title: '账号',
    dataIndex: 'nickname',
    width: '18%',
    className: 'text-center',
    render: (nickname, record) => (
      <div>
        <h3>{nickname}</h3>
        <Tag color="#00A0E9">{OJ_MAP[record.oj_name]}</Tag>
      </div>
    ),
  }, {
    title: '状态',
    dataIndex: 'status',
    width: '18%',
    render: status => {
      switch (status) {
        case AccountStatus.NOT_INIT:
          return <StatusPoint color="gray">未初始化</StatusPoint>;
        case AccountStatus.NORMAL:
          return <StatusPoint color="green">正常</StatusPoint>;
        case AccountStatus.QUEUE:
          return <StatusPoint color="light-blue">排队</StatusPoint>;
        case AccountStatus.UPDATING:
          return <StatusPoint color="blue">更新中</StatusPoint>;
        case AccountStatus.UPDATE_ERROR:
          return <StatusPoint color="red">更新错误</StatusPoint>;
        case AccountStatus.ACCOUNT_ERROR:
          return <StatusPoint color="red">账号错误</StatusPoint>;
        case AccountStatus.STOP:
          return <StatusPoint color="gray">终止</StatusPoint>;
        default:
          return null;
      }
    },
  }, {
    title: '关联用户',
    dataIndex: 'user.name',
    width: '10%',
  }, {
    title: '信息',
    dataIndex: 'solved',
    width: '20%',
    render: (solved, record) => {
      const isRating = ['cf', 'bc'].indexOf(record.oj_name) >= 0;
      return (
        <div>
          {isRating ? 'Rating' : 'Accepted'}: <b>{ solved }</b><br />
          {isRating ? 'MaxRating' : 'Submitted'}: <b>{ record.submitted }</b>
        </div>
      );
    },
  }, {
    title: '更新时间',
    dataIndex: 'updated_at',
    width: '20%'
  }, {
    title: '操作',
    key: 'operation',
    render: (text, record) => (
      <span>
        <Link onClick={() => operations.onEdit(record)}>修改</Link>
        <span className="ant-divider" />
        <Popconfirm
          title="确定要删除吗？" placement="left"
          onConfirm={() => operations.onDelete(record)}
        >
          <a>删除</a>
        </Popconfirm>
      </span>
    ),
  }]
);


class ProfileAccount extends React.PureComponent {
  static propTypes = {
    location: PropTypes.object,
    dispatch: PropTypes.func,
    loading: PropTypes.bool,
    user: PropTypes.object,
    list: PropTypes.array,
    filters: PropTypes.object,
    pagination: PropTypes.object,
  }

  static updateData(user, dispatch) {
    if (user && user.id) {
      const filters = JSON.stringify({ user_id: user.id });
      dispatch({ type: 'account/saveParams', payload: { filters } });
      dispatch({ type: 'account/fetchList', payload: { filters } });
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      showEditModal: false,
      activeRecord: null,
    };
    this.handleTableChange = this.handleTableChange.bind(this);
  }

  componentDidMount() {
    ProfileAccount.updateData(this.props.user, this.props.dispatch);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.user !== this.props.user) {
      ProfileAccount.updateData(nextProps.user, this.props.dispatch);
    }
  }

  handleTableChange(pagination) {
    this.props.dispatch({
      type: 'account/fetchList',
      payload: { page: pagination.current, filters: JSON.stringify(this.props.filters) }
    });
  }

  render() {
    const { showEditModal, activeRecord } = this.state;
    const columns = getColumns(this.props.filters, {
      onEdit: (r) => this.setState({ showEditModal: true, activeRecord: r })
    });
    return (
      <div>
        <div className="table-operations clear-fix">
          <Button type="primary" onClick={() => this.setState({ showEditModal: true })}>
            添加账号
          </Button>
        </div>
        <Table
          bordered size="small"
          onChange={this.handleTableChange}
          rowKey={record => record.id}
          columns={columns} dataSource={this.props.list}
          pagination={this.props.pagination} loading={this.props.loading}
        />
        <Modal
          title="账号修改" visible={showEditModal} footer={null}
          onCancel={() => this.setState({ showEditModal: false })}
        >
          <AccountForm account={activeRecord} onSubmit={this.onUpdate} />
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({ loading, account }) => ({
  loading: loading.models.account,
  list: account.list,
  filters: account.filters,
  pagination: {
    current: account.page,
    pageSize: account.per,
    total: account.totalCount,
    showTotal: total => <span>共有 {total} 个账号</span>,
  }
});

export default connect(mapStateToProps)(ProfileAccount);
